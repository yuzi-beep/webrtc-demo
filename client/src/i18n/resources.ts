export const resources = {
  "zh-CN": {
    translation: {
      home: {
        title: "Rooma",
        subtitleLine1: "轻量音视频会议 —— 最多支持 4 人，",
        subtitleLine2: "无需注册即可使用。",
        createMeeting: "创建新会议",
        joinHint: "或加入已有会议",
        joinPlaceholder: "粘贴房间链接或房间号",
        join: "加入",
      },
      room: {
        connecting: "正在连接房间...",
        roomIdLabel: "房间号：{{roomId}}",
      },
      chat: {
        title: "聊天",
        empty: "暂无消息",
        self: "你",
        inputPlaceholder: "输入消息...",
        send: "发送",
      },
      controls: {
        mute: "静音",
        unmute: "取消静音",
        turnOnCamera: "开启摄像头",
        turnOffCamera: "关闭摄像头",
        shareScreen: "共享屏幕",
        stopShareScreen: "停止共享屏幕",
        enableMirror: "开启镜像",
        disableMirror: "关闭镜像",
        enableEcho: "开启回声",
        disableEcho: "关闭回声",
        copyMeetingLink: "复制会议链接",
        copyLink: "复制链接",
        leaveMeeting: "离开会议",
      },
      user: {
        nicknamePlaceholder: "你的昵称",
        save: "保存",
      },
      video: {
        selfSuffix: "（你）",
      },
    },
  },
  "en-US": {
    translation: {
      home: {
        title: "Rooma",
        subtitleLine1: "Lightweight video meeting for up to 4 participants,",
        subtitleLine2: "no sign-up required.",
        createMeeting: "Create New Meeting",
        joinHint: "Or join an existing meeting",
        joinPlaceholder: "Paste room link or room ID",
        join: "Join",
      },
      room: {
        connecting: "Connecting to room...",
        roomIdLabel: "Room: {{roomId}}",
      },
      chat: {
        title: "Chat",
        empty: "No messages yet",
        self: "You",
        inputPlaceholder: "Type a message...",
        send: "Send",
      },
      controls: {
        mute: "Mute",
        unmute: "Unmute",
        turnOnCamera: "Turn on camera",
        turnOffCamera: "Turn off camera",
        shareScreen: "Share screen",
        stopShareScreen: "Stop sharing screen",
        enableMirror: "Enable mirror",
        disableMirror: "Disable mirror",
        enableEcho: "Enable echo",
        disableEcho: "Disable echo",
        copyMeetingLink: "Copy meeting link",
        copyLink: "Copy Link",
        leaveMeeting: "Leave meeting",
      },
      user: {
        nicknamePlaceholder: "Your nickname",
        save: "Save",
      },
      video: {
        selfSuffix: " (You)",
      },
    },
  },
} as const;

export type AppLocale = keyof typeof resources;
