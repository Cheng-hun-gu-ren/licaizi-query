/**
 * 理财产品查询工具 - 简化版前端脚本
 * 仅包含页面切换和下载方式提示功能
 */

// 全局变量
let currentTab = 'query';

// 下载方式提示文案
const CONTACT_MESSAGE = '请添加微信chgr_CarpeDiem，备注来意后免费获取。';

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
 * 显示下载方式提示
 */
function showContactModal() {
    const modalElement = document.getElementById('wechat-modal');
    
    // 优先使用 Bootstrap 模态框，如果缺失则回退到 alert
    if (modalElement && window.bootstrap && bootstrap.Modal) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    } else {
        alert(CONTACT_MESSAGE);
    }
}
