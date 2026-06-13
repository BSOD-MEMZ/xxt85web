@echo off
for %%a in (*.jpg *.jpeg *.png) do (
    echo 正在转换: %%a
    ffmpeg -y -i "%%a" -vf "scale=-1:800" -c:v libwebp -quality 0 -compression_level 6 "%%~na.webp"
    if exist "%%~na.webp" (
        del "%%a"
        echo 已替换为: %%~na.webp
    ) else (
        echo 转换失败，保留原文件: %%a
    )
)
echo 完成！