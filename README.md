<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RetroBit - 8-Bit Audio Converter

一个复古风格的音频转换器，可以将任何音频文件转换为 8-bit 风格的音效。

## 🌐 在线体验

**在线地址：** [https://when.run/RetroBit/](https://when.run/RetroBit/)

直接在浏览器中体验 RetroBit，无需安装任何依赖！

## 🚀 本地运行

**环境要求：** Node.js

1. 安装依赖：
   ```bash
   npm install
   ```

2. 配置 API 密钥（可选，用于 AI 生成封面和描述）：
   - 创建 `.env.local` 文件
   - 设置 `GEMINI_API_KEY` 为你的 Gemini API 密钥

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 在浏览器中打开 http://localhost:3000

## 📦 构建部署

```bash
npm run build
```

构建产物在 `dist` 目录中。

## 🎵 内置音频

项目包含 7 首推荐曲目，可直接在"推荐"标签页中点击播放：
- Seven Nation Army - The White Stripes
- Axel F - Harold Faltermeyer
- Blue (Da Ba Dee) - Eiffel 65
- Billie Jean - Michael Jackson
- 残酷天使的行动纲领 - 高桥洋子
- Faded - Alan Walker
- Toccata and Fugue in D Minor - Bach

要重新下载音频文件，运行：
```bash
bash scripts/download-music.sh
```

## ✨ 功能特性

- 🎹 多预设模式：任天堂、游戏男孩、DOS、蒸汽波、原始音质
- 🎚️ 实时音效调整：位深度、低通滤波、失真度、音调控制
- 📊 可视化频谱显示
- 🎨 AI 生成像素封面和歌曲描述（需要 Gemini API）
- 📱 响应式设计，支持移动设备
