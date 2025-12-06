#!/bin/bash

# 音频下载脚本
# 需要先安装 yt-dlp: brew install yt-dlp 或 pip install yt-dlp
# 
# 使用说明：
# 1. 确保已安装 yt-dlp
# 2. 在项目根目录运行: bash scripts/download-music.sh

AUDIO_DIR="public/audio"

# 创建目录
mkdir -p "$AUDIO_DIR"

# 检查 yt-dlp 是否安装
if ! command -v yt-dlp &> /dev/null; then
    echo "错误: 未找到 yt-dlp"
    echo "请先安装 yt-dlp:"
    echo "  macOS: brew install yt-dlp"
    echo "  Linux: pip install yt-dlp"
    echo "  Windows: pip install yt-dlp"
    exit 1
fi

echo "开始下载推荐曲目..."
echo ""

# 下载函数
download_track() {
    local filename=$1
    local url=$2
    
    # 检查文件是否已存在
    if [ -f "$AUDIO_DIR/$filename" ]; then
        echo "跳过（已存在）: $filename"
        echo ""
        return 0
    fi
    
    echo "正在下载: $filename"
    echo "URL: $url"
    
    # 尝试使用浏览器 cookies（如果可用）
    if [ -f "$HOME/Library/Application Support/Google/Chrome/Default/Cookies" ] || [ -f "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/Default/Cookies" ]; then
        # macOS Chrome/Brave
        yt-dlp --cookies-from-browser chrome -x --audio-format mp3 \
            --audio-quality 192K \
            -o "$AUDIO_DIR/$filename" \
            "$url" 2>&1
    elif [ -f "$HOME/.config/google-chrome/Default/Cookies" ] || [ -f "$HOME/.config/chromium/Default/Cookies" ]; then
        # Linux Chrome/Chromium
        yt-dlp --cookies-from-browser chrome -x --audio-format mp3 \
            --audio-quality 192K \
            -o "$AUDIO_DIR/$filename" \
            "$url" 2>&1
    else
        # 不使用 cookies，可能失败
        yt-dlp -x --audio-format mp3 \
            --audio-quality 192K \
            -o "$AUDIO_DIR/$filename" \
            "$url" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        echo "✓ 成功下载: $filename"
    else
        echo "✗ 下载失败: $filename"
    fi
    echo ""
}

# 下载所有曲目
download_track "seven-nation-army.mp3" "https://www.youtube.com/watch?v=0J2QdDbelmY"
# 尝试多个可能的链接
download_track "axel-f.mp3" "https://www.youtube.com/watch?v=k85mRPqvMbE" || \
download_track "axel-f.mp3" "https://www.youtube.com/watch?v=kkx-7fs4J-o"
download_track "blue-da-ba-dee.mp3" "https://www.youtube.com/watch?v=68ugkg9RePc"
download_track "billie-jean.mp3" "https://www.youtube.com/watch?v=Zi_XLOBDo_Y"
download_track "cruel-angel-thesis.mp3" "https://www.youtube.com/watch?v=Xa0Q0J5tOP0"
download_track "faded.mp3" "https://www.youtube.com/watch?v=60ItHLz5WEA"
download_track "toccata-fugue.mp3" "https://www.youtube.com/watch?v=_FXoyr_FyFw"

echo "下载完成！"
echo "如果某些文件下载失败，请手动搜索并下载对应的音频文件。"

