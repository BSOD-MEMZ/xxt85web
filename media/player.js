document.addEventListener('DOMContentLoaded', function () {
    const video = document.getElementById('main-video');
    const playPauseBtn = document.getElementById('play-pause');
    const progressBar = document.getElementById('progress-bar');
    const timeDisplay = document.getElementById('time-display');
    const muteBtn = document.getElementById('mute');
    const volumeSlider = document.getElementById('volume-slider');
    const fullscreenBtn = document.getElementById('fullscreen');
    const progressContainer = document.querySelector('.progress-container');
    const loader = document.getElementById('loader');

    playPauseBtn.addEventListener('click', function () {
        if (video.paused) {
            video.play();
            playPauseBtn.className = 'control-button pause-btn';
        } else {
            video.pause();
            playPauseBtn.className = 'control-button play-btn';
        }
    });

    video.addEventListener('timeupdate', function () {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;

        // 更新时间显示
        const currentMinutes = Math.floor(video.currentTime / 60);
        const currentSeconds = Math.floor(video.currentTime % 60);
        const durationMinutes = Math.floor(video.duration / 60);
        const durationSeconds = Math.floor(video.duration % 60);

        timeDisplay.textContent =
            `${String(currentMinutes).padStart(2, '0')}:${String(currentSeconds).padStart(2, '0')} / 
                    ${String(durationMinutes).padStart(2, '0')}:${String(durationSeconds).padStart(2, '0')}`;
    });

    // 点击进度条跳转
    progressContainer.addEventListener('click', function (e) {
        const pos = (e.pageX - this.getBoundingClientRect().left) / this.offsetWidth;
        video.currentTime = pos * video.duration;
    });

    // 音量控制
    volumeSlider.addEventListener('input', function () {
        video.volume = this.value;
        muteBtn.className = this.value == 0 ? 'control-button muted-btn' : 'control-button mute-btn';
    });

    // 静音功能
    muteBtn.addEventListener('click', function () {
        video.muted = !video.muted;
        if (video.muted) {
            this.className = 'control-button muted-btn';
            volumeSlider.value = 0;
        } else {
            this.className = 'control-button mute-btn';
            volumeSlider.value = video.volume;
        }
    });

    fullscreenBtn.addEventListener('click', function () {
        if (!document.fullscreenElement) {
            if (video.requestFullscreen) {
                video.requestFullscreen();
                this.className = 'control-button exit-fullscreen-btn';
            } else if (video.mozRequestFullScreen) {
                video.mozRequestFullScreen();
                this.className = 'control-button exit-fullscreen-btn';
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
                this.className = 'control-button exit-fullscreen-btn';
            } else if (video.msRequestFullscreen) {
                video.msRequestFullscreen();
                this.className = 'control-button exit-fullscreen-btn';
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                this.className = 'control-button fullscreen-btn';
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
                this.className = 'control-button fullscreen-btn';
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
                this.className = 'control-button fullscreen-btn';
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
                this.className = 'control-button fullscreen-btn';
            }
        }
    });

    // 视频结束时重置播放按钮
    video.addEventListener('ended', function () {
        playPauseBtn.className = 'control-button play-btn';
    });

    // 视频加载状态
    video.addEventListener('waiting', function () {
        loader.style.display = 'block';
    });

    video.addEventListener('playing', function () {
        loader.style.display = 'none';
    });

    // 键盘快捷键支持
    document.addEventListener('keydown', function (e) {
        // 空格键控制播放/暂停
        if (e.code === 'Space') {
            e.preventDefault();
            if (video.paused) {
                video.play();
                playPauseBtn.className = 'control-button pause-btn';
            } else {
                video.pause();
                playPauseBtn.className = 'control-button play-btn';
            }
        }

        // 左右箭头控制快进/快退
        if (e.code === 'ArrowRight') {
            video.currentTime = Math.min(video.currentTime + 5, video.duration);
        }
        if (e.code === 'ArrowLeft') {
            video.currentTime = Math.max(video.currentTime - 5, 0);
        }

        // M键控制静音
        if (e.code === 'KeyM') {
            video.muted = !video.muted;
            muteBtn.className = video.muted ? 'control-button muted-btn' : 'control-button mute-btn';
        }

        // F键控制全屏
        if (e.code === 'KeyF') {
            if (!document.fullscreenElement) {
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                    fullscreenBtn.className = 'control-button exit-fullscreen-btn';
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    fullscreenBtn.className = 'control-button fullscreen-btn';
                }
            }
        }
    });

    // 初始设置
    video.volume = volumeSlider.value;

    // 模拟视频时长
    video.addEventListener('loadedmetadata', function () {
        const durationMinutes = Math.floor(video.duration / 60);
        const durationSeconds = Math.floor(video.duration % 60);
        timeDisplay.textContent = `00:00 / ${String(durationMinutes).padStart(2, '0')}:${String(durationSeconds).padStart(2, '0')}`;
    });
});