# 音频文件下载指南

## 方式一：使用 yt-dlp 自动下载（推荐）

### 1. 安装 yt-dlp

**macOS:**
```bash
brew install yt-dlp
```

**其他系统:**
```bash
pip install yt-dlp
```

### 2. 运行下载脚本

```bash
bash scripts/download-music.sh
```

脚本会自动下载所有推荐曲目到 `public/audio/` 目录。

### 3. 手动下载单个文件

如果脚本中的链接失效，可以手动搜索并下载：

```bash
# 搜索歌曲（替换 SONG_NAME 为实际歌曲名）
yt-dlp -x --audio-format mp3 -o "public/audio/seven-nation-army.mp3" "ytsearch1:White Stripes Seven Nation Army"
```

## 方式二：手动下载

1. 从合法音乐平台（如 Spotify、Apple Music、网易云音乐等）下载
2. 将文件转换为 MP3 格式（如需要）
3. 重命名为对应的文件名并放入 `public/audio/` 目录

## 文件命名列表

- `seven-nation-army.mp3` - The White Stripes - Seven Nation Army
- `axel-f.mp3` - Harold Faltermeyer - Axel F
- `blue-da-ba-dee.mp3` - Eiffel 65 - Blue (Da Ba Dee)
- `billie-jean.mp3` - Michael Jackson - Billie Jean
- `cruel-angel-thesis.mp3` - 高桥洋子 - 残酷天使的行动纲领
- `faded.mp3` - Alan Walker - Faded
- `toccata-fugue.mp3` - Bach - Toccata and Fugue in D Minor

## 注意事项

⚠️ **版权声明**：请确保您拥有这些音频文件的合法使用权。本脚本仅用于个人学习和演示目的。

