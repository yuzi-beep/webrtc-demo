# WebRTC Demo

一个基于 **React + Vite + TypeScript**（前端）和 **NestJS + Socket.IO**（后端）的多人音视频会议示例项目。

- 支持创建/加入房间
- 最多 4 人同房间通话
- 支持麦克风、摄像头、屏幕共享、镜像、回声开关
- 支持复制房间链接、聊天室消息

## 项目结构

```txt
webrtc-demo/
├── client/   # 前端（Vite + React + simple-peer）
└── server/   # 信令服务（NestJS + Socket.IO）
```

## 运行环境

- Node.js 18+
- Bun 1.0+

> 当前仓库包含 `bun.lock`，推荐使用 Bun 进行依赖安装和启动。

## 快速开始

### 1) 安装依赖

```bash
# 前端
cd client
bun install

# 后端
cd ../server
bun install
```

### 2) 启动后端信令服务

```bash
cd server
bun run start:dev
```

默认监听：`http://localhost:3000`

健康检查：`GET http://localhost:3000/health`

### 3) 启动前端

```bash
cd client
bun run dev
```

默认地址：`http://localhost:5173`

## 使用说明

1. 打开首页后点击 **创建新会议** 创建会议。
2. 将房间链接分享给其他人。
3. 其他人可粘贴完整链接或房间号加入。
4. 房间人数上限为 4，超过会收到 `ROOM_FULL`。

## 常用脚本

### 前端（`client/package.json`）

- `bun run dev`：启动开发服务器
- `bun run build`：构建生产包
- `bun run lint`：代码检查
- `bun run preview`：预览构建产物

### 后端（`server/package.json`）

- `bun run start:dev`：开发模式（watch）
- `bun run build`：构建
- `bun run start:prod`：生产模式运行
- `bun run test`：单元测试
- `bun run test:e2e`：端到端测试

## 端口与连接说明

- 前端开发端口：`5173`
- 后端默认端口：`3000`
- 前端 Socket 连接地址当前写死在：
  - `client/src/pages/room/_hooks/useSocket.ts`
  - `const SIGNALING_SERVER = "http://localhost:3000"`

如果你把后端部署到其他地址，请同步修改该常量。

## 故障排查

- 前端一直显示“正在连接房间...”
  - 确认后端已启动并可访问 `http://localhost:3000/health`
  - 检查浏览器控制台是否有 Socket 连接报错
- 无法获取摄像头/麦克风
  - 确认浏览器授予了媒体权限
  - 建议使用最新版 Chrome/Edge
- 局域网多设备联调失败
  - 将 `SIGNALING_SERVER` 改为可被其他设备访问的 IP 地址
  - 同时确保防火墙放行对应端口

## 许可说明

当前仓库未显式声明开源许可，默认仅用于学习与内部演示。
