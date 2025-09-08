/**
 * 理财产品查询工具 - 简化版前端脚本
 * 仅包含页面切换和下载功能
 */

// 全局变量
let currentTab = 'query';

// 客户端下载地址 - 阿里云OSS链接
const CLIENT_DOWNLOAD_URL = 'https://guorui-cuhksz.oss-cn-shenzhen.aliyuncs.com/ProductQuery.exe';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * 初始化应用
 */
function initializeApp() {
    // 初始化页面
    showTab('query');
}

/**
 * 显示指定标签页
 */
function showTab(tabName) {
    // 隐藏所有标签页内容
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.add('d-none');
    });
    
    // 移除所有导航链接的活动状态
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 显示指定的标签页
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.remove('d-none');
    }
    
    // 激活对应的导航链接
    const activeLink = document.querySelector(`a[onclick="showTab('${tabName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentTab = tabName;
}

/**
 * 下载客户端
 */
function downloadClient() {
    if (CLIENT_DOWNLOAD_URL === '#' || CLIENT_DOWNLOAD_URL === '') {
        // 如果下载链接未设置，显示提示
        alert('下载链接暂未配置，请联系管理员');
        return;
    }
    
    // 创建隐藏的链接进行下载
    const link = document.createElement('a');
    link.href = CLIENT_DOWNLOAD_URL;
    link.download = 'ProductQuery.exe';
    link.target = '_blank';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 显示下载提示
    showNotification('开始下载理财产品查询工具...', 'info');
}

/**
 * 显示通知消息
 */
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
    notification.innerHTML = `
        <i class="fas fa-info-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

/**
 * 更新下载链接
 */
function updateDownloadUrl(url) {
    CLIENT_DOWNLOAD_URL = url;
    console.log('下载链接已更新:', url);
}