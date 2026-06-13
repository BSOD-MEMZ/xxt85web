# 进入当前文件夹（请将路径改为你的实际路径）
$folder = "C:\你的图片文件夹路径"
cd $folder

# 获取所有 .jpg 文件
$files = Get-ChildItem -Filter "*.jpg"

# 提取每个文件最后一个下划线后的数字，用于排序
$sorted = $files | ForEach-Object {
    if ($_.BaseName -match '_(\d+)$') {
        $num = [int]$matches[1]
        [PSCustomObject]@{File=$_; Num=$num}
    } else {
        Write-Host "警告: 文件 $($_.Name) 不包含数字序号，将按名称排序"
        [PSCustomObject]@{File=$_; Num=$null}
    }
} | Sort-Object { if ($_.Num -eq $null) { $_.File.Name } else { $_.Num } }

# 按顺序重命名
$i = 1
foreach ($item in $sorted) {
    $old = $item.File.Name
    $new = "$i.jpg"
    if ($old -ne $new) {
        Write-Host "重命名: $old -> $new"
        Rename-Item -Path $item.File.FullName -NewName $new -ErrorAction Stop
    }
    $i++
}
Write-Host "完成！共处理 $($sorted.Count) 个文件。"