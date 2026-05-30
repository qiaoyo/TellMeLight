# Rev A2 Circuit Explanation

Date: 2026-05-30

这份说明用于理解当前 TellMeLight Rev A2 电路。现在的 KiCad 仍然是工程基线, 不是最终可下单原理图; 但是这里已经把主要器件、连线和工作原理展开到可以学习和评审的程度。

## 1. 总体结构

TellMeLight 是一个 USB-C 供电的 RP2040 小硬件。电脑通过 USB 和 RP2040 通信, RP2040 再通过 I2C 控制 LP5024RSMR。LP5024RSMR 是 24 路 LED current sink 驱动器, 其中 OUT0 到 OUT17 用来控制 6 个 RGB LED, 每个 session slot 占 3 路颜色通道。

核心电源关系是:

- USB-C 的 VBUS 提供 5V。
- 5V 直接作为 VLED, 供给 RGB LED 的公共阳极。
- AP2112K-3.3TRG1 把 5V 转成 3V3。
- 3V3 供 RP2040、QSPI flash、LP5024RSMR 逻辑、电阻上拉等低压数字电路。

这样做的好处是 LED 电流不经过 3V3 LDO, LDO 只承担逻辑电流, 发热更可控。

## 2. USB-C 入口

J1 是 USB-C 2.0 连接器。A4/B4/A9/B9 接 VBUS, A1/B1/A12/B12 接 GND。A6/B6 是 D+, A7/B7 是 D-。因为 USB-C 插头可以正反插, 连接器内有两组 D+/D- 焊盘, 设计上会把同名焊盘并到同一根 USB_DP_CONN / USB_DM_CONN。

CC1 和 CC2 各接一个 5.1k 电阻到 GND。这个 5.1k 叫 Rd, 它告诉上游 USB-C 供电设备: 我是一个需要供电的 USB device/sink。没有这个电阻, 很多 USB-C 电源不会给 VBUS。

SBU1/SBU2 在 USB 2.0 设备里不用, 先不连接。

## 3. USB ESD 与 27R 串联电阻

U5 是 TPD2EUSB30DRTR。Rev A2 的一个关键修正是: 这个器件是 3-pin DRT 封装, 不是 6-pin flow-through 封装。它的 pin 1 接 D+, pin 2 接 D-, pin 3 接 GND。

它的工作方式不是让 USB 信号从一边进另一边出, 而是在 D+/D- 到 GND 之间提供很低电容的 ESD 泄放路径。静电打进 USB 口时, 能量优先通过 U5 回到地, 保护 RP2040 的 USB pins。

R1/R2 是 27R 串联电阻, 分别在 D+ 和 D- 上。RP2040 datasheet 要求 USB_DP/USB_DM 每根线上有 27R series termination。实际走线顺序应该是:

USB-C connector -> connector-side ESD clamp -> 27R series resistor -> RP2040 USB_DP/USB_DM。

## 4. RP2040 主控

U1 是 RP2040。它负责:

- USB device 通信。
- 读取 host 发送的 session 状态。
- 在 firmware 里把 running/approval/done/error/idle 映射成亮度和颜色。
- 通过 I2C 控制 LP5024RSMR。
- 通过 QSPI flash 启动和存储固件。

关键引脚:

- USB_DM pin 46, USB_DP pin 47: 接 USB 数据线。
- GPIO4 pin 6: I2C SDA。
- GPIO5 pin 7: I2C SCL。
- QSPI_SD0..3, QSPI_SCLK, QSPI_CSn: 接外部 flash。
- XIN/XOUT pin 20/21: 接 12MHz 晶振。
- SWCLK pin 24, SWDIO pin 25: 调试和烧录。
- RUN pin 26: 低电平复位。
- TESTEN pin 19: 必须接 GND, 避免进入工厂测试模式。

## 5. QSPI flash

U3 是 W25Q32JVSSIQ。RP2040 没有内置大容量 flash, 固件从外部 QSPI flash 运行或加载。

SOIC-8 flash 的连接是:

- /CS -> RP2040 QSPI_CSn。
- CLK -> RP2040 QSPI_SCLK。
- IO0/DI -> RP2040 QSPI_SD0。
- IO1/DO -> RP2040 QSPI_SD1。
- IO2/WP -> RP2040 QSPI_SD2。
- IO3/HOLD -> RP2040 QSPI_SD3。
- VCC -> 3V3, GND -> GND。

BOOTSEL 按钮会在复位时把 QSPI_CSn 拉低, 让 RP2040 进入 USB bootloader, 这样可以从电脑重新刷固件。

## 6. LP5024RSMR LED driver

U2 是 LP5024RSMR。它的 OUT0 到 OUT23 都是 current sink, 中文可以理解成"恒流下拉端"。LED 的公共阳极接 VLED, 每个颜色阴极接到一个 OUT pin。当 LP5024 打开某一路 OUT, 电流从 VLED 经过 LED 流入 LP5024, 再回到 GND。

这种结构比直接用 MCU GPIO 推 LED 更适合产品:

- 每个颜色通道电流更一致。
- RP2040 不需要承担 LED 电流。
- LP5024 有 PWM 和颜色控制寄存器, 呼吸灯/持续亮/等待批准等状态更容易做。

Rev A2 使用 OUT0..OUT17 对应 6 个 RGB LED。OUT18..OUT23 保留。ADDR0/ADDR1 接 GND, 让 I2C 地址固定。SDA/SCL 接 RP2040 的 GPIO4/GPIO5, R5/R6 4.7k 上拉到 3V3。

IREF pin 接 R7 10k 到 GND, 决定 LP5024 的满量程电流。公式是 RIREF = 105 * 0.7V / ISET。10k 大约得到 7.35mA, 比 15mA 更保守, 适合先做一个不会太刺眼、也不容易过热的原型。

VCAP pin 必须接 1uF 到 GND, VCC 也建议 1uF 到 GND, 并且都要靠近 U2。

## 7. RGB LED 六格

D1-D6 是六个 RGB LED, 对应 FIFO 的六个 session slot。新的 session 从最右侧进入, 旧 session 向左移动, 超过六个时最老的被挤掉。

当前通道计划:

- D1: OUT0/OUT1/OUT2。
- D2: OUT3/OUT4/OUT5。
- D3: OUT6/OUT7/OUT8。
- D4: OUT9/OUT10/OUT11。
- D5: OUT12/OUT13/OUT14。
- D6: OUT15/OUT16/OUT17。

Rev A2 已经把 S4-3528RGBTA-A 的 pad/color/common-anode pinout 映射到本地 footprint: pin 1 是 blue cathode, pin 2 是 common anode, pin 3 是 green cathode, pin 4 是 red cathode。真正下单前仍然要在 JLC orientation preview 里看 D1-D6 是否旋转正确。

## 8. 电源和去耦

AP2112K-3.3TRG1 把 USB 5V 转成 3V3。C11/C12 这类 10uF 电容用于 LDO 输入/输出和电源缓冲。C1-C10 的 100nF 电容用于各 IC 附近的高频去耦。

去耦电容的作用是给芯片瞬时电流一个很短的本地回路。如果没有这些小电容, USB/I2C/QSPI/PWM 边沿会让电源线上出现尖峰或下陷, 轻则不稳定, 重则 USB 枚举失败或 MCU reset。

## 9. 调试和测试

TP9/TP10 是 SWDIO/SWCLK, 可以用调试器烧录和调试。TP11 是 RUN reset, TP12 是 3V3, TP13 是 GND。TP1-TP8 是 bring-up 测试点, 用于测 VBUS、3V3、GND、I2C、USB、RUN 等关键网络。

这些测试点的目标是: 不需要焊接排针, 也能在硬件回来后定位问题。

## 10. 当前不能下单的原因

- RGB LED pinout 已映射到 TUOZHAN datasheet 和本地 footprint。
- JLC SMT placement/orientation preview 还没人工确认, 这是当前 RED gate。
- USB-C shell grounding 需要结合外壳和装饰面板决定。
- 晶振和 33pF 负载电容是第一版候选, 还需要最终负载电容计算。

这些不是坏消息, 反而是 A2 最重要的价值: 把风险摊在桌面上, 让后面的 PCB 下单不会靠猜。
