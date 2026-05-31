# TellMeLight Rev A4 电路与检查讲解

Date: 2026-05-31

Rev A4 的目标是把 Rev A3 的 JLC 预览包推进到真实可制造 PCB。当前已经补上 RP2040 `VREG_VOUT` 的 1uF 本地电容 `C18`，并建立了 KiCad DSN -> Freerouting SES -> KiCad 导回的自动布线实验链路。重要结论是：当前 A4 仍是 routing checkpoint，不是可付款下单版本；只要 DRC 里还有 unconnected items，就不要在 JLC 付款。

## 1. 总体电路

TellMeLight 是 USB-C 有线供电的 AI session 状态灯。主机通过 USB 和 `RP2040` 通信，RP2040 再通过 `I2C` 控制 `LP5024RSMR` LED driver。`LP5024RSMR` 是 24 路 `current sink`，当前使用 18 路驱动 6 个 RGB LED，每个 session slot 占用 R/G/B 三路。

核心电源路径是：

- `USB-C J1` 提供 `VBUS`，也就是 5V 输入。
- `R10 0R` 把 `VBUS` 显式连接成 `VLED`，供给 RGB LED 公共阳极。
- `U4 AP2112K-3.3` 把 `VBUS` 降成 `3V3`，供给 RP2040、QSPI flash、LP5024 逻辑电源和上拉电阻。
- `GND` 是全板公共参考地，最终需要 B.Cu/In2.Cu 大面积地平面和 stitching vias。

这样 LED 电流不经过 3V3 LDO，LDO 主要承担逻辑电流，发热和压降风险更低。

## 2. USB-C 与保护

`J1` 是 USB-C 2.0 receptacle。`A4/B4/A9/B9` 是 `VBUS`，`A1/B1/A12/B12` 是 `GND`，`A6/B6` 是 D+，`A7/B7` 是 D-。因为 USB-C 可以正反插，两个方向的 D+/D- 焊盘要合并到 `USB_DP_CONN` / `USB_DM_CONN`。

`R3/R4` 是 5.1k CC pull-down，告诉上游供电设备“我是一个 USB device/sink”。没有这两个 Rd，很多 USB-C 供电口不会打开 VBUS。

`U5 TPD2EUSB30` 是 D+/D- 的 `ESD` clamp。它不是串在信号中间的芯片，而是给静电提供到 GND 的泄放路径。USB 信号顺序应理解为：

`USB-C connector -> U5 ESD clamp node -> R1/R2 27R series resistors -> RP2040 USB pins`

`USB-C shell` 采用 `R9 1M // C17 10nF` 到 GND 的 RC 并联连接。R9 给外壳慢速泄放路径，C17 给高频噪声/ESD 提供更低阻抗路径，比直接硬接地更温和，也没有做过度复杂的隔离网络。

`U6 TPD1E05U06` 是 `VLED` 到 `GND` 的 ESD/TVS 保护，保护 LED 供电轨。它不是给每颗 LED 单独保护，而是保护 `VLED` rail。

## 3. RP2040、flash 与晶振

`U1 RP2040` 负责 USB device、固件运行、session 状态解析，以及 I2C 控制 LP5024。

关键连接：

- `USB_DM_MCU` / `USB_DP_MCU`: RP2040 USB 数据脚，经 R1/R2 接 USB-C。
- `I2C0_SDA` / `I2C0_SCL`: 接 LP5024 的 SDA/SCL，并由 R5/R6 4.7k 上拉到 `3V3`。
- `FLASH_CS_N_BOOTSEL`, `FLASH_SCLK`, `FLASH_IO0_MOSI`, `FLASH_IO1_MISO`, `FLASH_WP_IO2`, `FLASH_HOLD_IO3`: 接 `QSPI flash U3`。
- `XIN` / `XOUT`: 接 `Y1 12MHz passive crystal` 和 `C13/C14` 负载电容。
- `SWDIO` / `SWCLK`: 接测试点 TP9/TP10。
- `RUN_RESET`: 接 reset 按钮和 TP11。
- `RP2040_VREG_OUT`: Rev A4 新增 `C18 1uF` 到 GND，本地去耦 RP2040 internal regulator output。

`U3 W25Q32JVSSIQ` 是外部 QSPI flash。RP2040 没有内置足够容量的程序 flash，所以固件从 U3 启动。`SW1 BOOT` 会在 reset 时拉低 QSPI CS，让 RP2040 进入 USB bootloader。

晶振部分要人工检查两点：`Y1` 必须是 passive crystal，不是 active oscillator；`C13/C14` 负载电容要靠近 Y1 和 RP2040 XIN/XOUT，最终值可以在真实晶振 datasheet 的 CL 条件下再微调。

## 4. LP5024 与 LED

`U2 LP5024RSMR` 的 OUT0-OUT23 都是 `current sink`。RGB LED 的公共阳极接 `VLED`，R/G/B 阴极分别接 LP5024 OUT pin。当某一路 OUT 打开时，电流路径是：

`VLED -> LED anode -> LED color die -> LP5024 OUTx current sink -> GND`

当前映射：

- `D1`: `D1_R/D1_G/D1_B` = OUT0/OUT1/OUT2
- `D2`: OUT3/OUT4/OUT5
- `D3`: OUT6/OUT7/OUT8
- `D4`: OUT9/OUT10/OUT11
- `D5`: OUT12/OUT13/OUT14
- `D6`: OUT15/OUT16/OUT17

`D1-D6` 的 pinout：pin 1 = blue cathode，pin 2 = common anode `VLED`，pin 3 = green cathode，pin 4 = red cathode。JLC 里看到 D1-D6 “需要确认颜色”是正常警告，但必须检查 RGB part 和方向。

`R7 10k` 设置 LP5024 full-scale current。`C15 1uF` 是 VCAP 电容，`C16 1uF` 是 VCC 本地电容。`R8 10k` 把 EN 拉到 3V3，让 LED driver 默认启用。

## 5. power-budget simulation

当前仿真不是 SPICE 模拟，而是 power-budget simulation：用器件电流估算 USB 5V、3V3 LDO 和 LED rail 的负载关系。

人工理解方式：

- idle 不发光，VLED 只有漏电和驱动静态消耗。
- running/approval 如果做 breathing，主要增加 LP5024 输出电流和 PWM 平均电流。
- done/error 如果持续亮，平均功耗比“闪两下然后灭”更高，但符合你希望一直挂着可见的产品逻辑。
- 最坏情况按 6 个 slot 全亮估算，但真实状态通常只有部分颜色和部分亮度。

Rev A4 的关键设计选择是让 LED current 走 `VBUS/VLED`，不压在 `3V3` LDO 上。

## 6. manual PCB inspection checklist

人工检查 PCB 时按这个顺序看：

1. 板框：Rev A4 目标板框是 76 mm x 56 mm，4 层板。
2. USB-C：J1 的 VBUS pads 合到 `VBUS`，GND pads 合到 `GND`，CC1/CC2 分别通过 R3/R4 到 GND。
3. USB 数据：J1 D+/D- 先到 U5 ESD 节点，再到 R1/R2，再到 RP2040 USB pins。
4. 电源：`VBUS -> R10 -> VLED`；`VBUS -> U4 -> 3V3`；U6 并在 `VLED` 和 GND 之间。
5. RP2040：`C18` 必须从 `RP2040_VREG_OUT` 到 GND，且靠近 U1 pin 45；C1/C2 等 100nF 要靠近 U1 电源脚。
6. flash：U3 的 CS/SCLK/IO0/IO1/IO2/IO3 全部接回 U1 对应 QSPI pins，BOOT 按钮 SW1 拉低 `FLASH_CS_N_BOOTSEL`。
7. crystal：Y1 和 C13/C14 组成 XIN/XOUT 回路，走线越短越好。
8. LP5024：R5/R6 上拉 I2C；R7 到 GND；C15/C16 靠近 U2；U2 OUT0-OUT17 到 D1-D6 对应颜色。
9. LED：每颗 LED pin 2 都到 `VLED`，pin 1/3/4 分别到 B/G/R current sink。
10. JLC 方向预览：重点看 D1-D6、U2、U5、U6、J1、Y1、SW1、SW2。
11. 下单 gate：只有 `DRC: 0 violations and 0 unconnected items` 且 JLC orientation preview 人工确认后，才可以付款。

## 7. Rev A4 当前状态

Rev A4 已经证明：BOM/CPL、JLC 器件选型、USB/VLED 保护、电源框架和自动布线工具链方向成立。但当前布局下，Freerouting 仍会留下 RP2040/LP5024 细脚附近的未连线。因此 Rev A4 现在不能下单。

下一步 A4 应该优先做 placement/routing 调整，而不是继续上传 JLC 付款：给 RP2040 和 LP5024 留出更明确的 fanout corridor，必要时调整 U1/U2/U3/R1/R2/C7/C18 的相对位置，然后重新跑 DSN/SES 和 DRC。
