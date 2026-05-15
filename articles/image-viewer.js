// 图片查看器功能
(function() {
    let currentImageIndex = -1;
    let images = [];

    // 创建模态框HTML
    function createModal() {
        const modal = document.createElement('div');
        modal.className = 'image-viewer-modal';
        modal.innerHTML = `
            <div class="image-viewer-content">
                <img class="image-viewer-close" src="imageclose.png" alt="Close" title="Close">
                <img class="image-viewer-img" src="" alt="Full size image">
                <img class="image-viewer-nav image-viewer-prev" src="left.png" alt="Previous" title="Previous">
                <img class="image-viewer-nav image-viewer-next" src="right.png" alt="Next" title="Next">
            </div>
        `;
        return modal;
    }

    // 初始化图片查看器
    function init() {
        // 获取所有文章内容中的图片
        const contentImages = document.querySelectorAll('.article-content img');
        
        if (contentImages.length === 0) return;

        images = Array.from(contentImages).filter(img => {
            // 过滤掉非图片内容的img标签（如按钮图标等）
            return img.src && 
                   !img.src.includes('.png') || 
                   img.src.includes('.jpg') || 
                   img.src.includes('.jpeg') || 
                   img.src.includes('.webp') ||
                   img.src.includes('.gif');
        });

        if (images.length === 0) return;

        // 创建模态框
        const modal = createModal();
        document.body.appendChild(modal);

        const imgElement = modal.querySelector('.image-viewer-img');
        const closeBtn = modal.querySelector('.image-viewer-close');
        const prevBtn = modal.querySelector('.image-viewer-prev');
        const nextBtn = modal.querySelector('.image-viewer-next');

        // 为每个图片添加点击事件
        images.forEach((img, index) => {
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                showImage(index, modal, imgElement, prevBtn, nextBtn);
            });
        });

        // 关闭按钮
        closeBtn.addEventListener('click', function() {
            closeModal(modal);
        });

        // 上一张按钮
        prevBtn.addEventListener('click', function() {
            if (currentImageIndex > 0) {
                currentImageIndex--;
                showImage(currentImageIndex, modal, imgElement, prevBtn, nextBtn);
            }
        });

        // 下一张按钮
        nextBtn.addEventListener('click', function() {
            if (currentImageIndex < images.length - 1) {
                currentImageIndex++;
                showImage(currentImageIndex, modal, imgElement, prevBtn, nextBtn);
            }
        });

        // 初始化按钮状态（只有一张图片的情况）
        if (images.length === 1) {
            prevBtn.src = 'left-disable.png';
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
            nextBtn.src = 'right-disable.png';
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        }

        // 点击背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal);
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', function(e) {
            if (modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeModal(modal);
                } else if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
                    currentImageIndex--;
                    showImage(currentImageIndex, modal, imgElement, prevBtn, nextBtn);
                } else if (e.key === 'ArrowRight' && currentImageIndex < images.length - 1) {
                    currentImageIndex++;
                    showImage(currentImageIndex, modal, imgElement, prevBtn, nextBtn);
                }
            }
        });
    }

    // 显示图片
    function showImage(index, modal, imgElement, prevBtn, nextBtn) {
        if (index < 0 || index >= images.length) return;
        
        currentImageIndex = index;
        imgElement.src = images[index].src;
        modal.classList.add('active');
        
        // 更新导航按钮图片和状态
        if (prevBtn && nextBtn) {
            if (currentImageIndex === 0) {
                prevBtn.src = 'left_disable.png';
                prevBtn.style.cursor = 'not-allowed';
            } else {
                prevBtn.src = 'left.png';
                prevBtn.style.cursor = 'pointer';
            }
            
            if (currentImageIndex === images.length - 1) {
                nextBtn.src = 'right_disable.png';
                nextBtn.style.cursor = 'not-allowed';
            } else {
                nextBtn.src = 'right.png';
                nextBtn.style.cursor = 'pointer';
            }
        }
    }

    // 关闭模态框
    function closeModal(modal) {
        modal.classList.remove('active');
        currentImageIndex = -1;
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
