/**
 * 理财产品查询工具 - 前端脚本
 */

// 全局变量
let serviceConnected = false;
let browserInitialized = false;
let queryResults = [];
let currentTab = 'query';

// API 基础地址
const API_BASE = 'http://localhost:8080';

// 客户端下载地址 - 这里需要替换为你的阿里云OSS下载链接
const CLIENT_DOWNLOAD_URL = 'https://your-oss-bucket.oss-region.aliyuncs.com/finance-query-client.exe';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkServiceStatus();
    
    // 定期检查服务状态
    setInterval(checkServiceStatus, 30000); // 每30秒检查一次
});

/**
 * 初始化应用
 */
function initializeApp() {
    // 设置查询模式切换
    const queryModeInputs = document.querySelectorAll('input[name="query-mode"]');
    queryModeInputs.forEach(input => {
        input.addEventListener('change', function() {
            toggleQueryMode(this.value);
        });
    });
    
    // 设置输入框回车事件
    document.getElementById('single-code-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !this.disabled) {
            querySingle();
        }
    });
    
    // 初始化提示工具
    initializeTooltips();
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 浏览器选择变更
    document.getElementById('browser-select').addEventListener('change', function() {
        if (browserInitialized) {
            showAlert('浏览器类型已变更，请重新初始化', 'warning');
            browserInitialized = false;
            updateButtonStates();
        }
    });
}

/**
 * 初始化提示工具
 */
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * 检查服务状态
 */
async function checkServiceStatus() {
    const statusElement = document.getElementById('service-status');
    const alertElement = document.getElementById('service-alert');
    const messageElement = document.getElementById('service-message');
    
    try {
        const response = await fetch(`${API_BASE}/health`, {
            method: 'GET',
            timeout: 3000
        });
        
        if (response.ok) {
            const data = await response.json();
            serviceConnected = true;
            browserInitialized = data.browser_ready || false;
            
            // 更新状态显示
            statusElement.innerHTML = '<i class="fas fa-check-circle me-1"></i>服务已连接';
            statusElement.className = 'badge service-connected';
            
            // 隐藏警告
            alertElement.classList.add('d-none');
            
            // 更新按钮状态
            updateButtonStates();
            
        } else {
            throw new Error('服务响应异常');
        }
        
    } catch (error) {
        serviceConnected = false;
        browserInitialized = false;
        
        // 更新状态显示
        statusElement.innerHTML = '<i class="fas fa-times-circle me-1"></i>服务未连接';
        statusElement.className = 'badge service-disconnected';
        
        // 显示安装提示
        showServiceAlert();
        
        // 更新按钮状态
        updateButtonStates();
    }
}

/**
 * 显示服务提醒
 */
function showServiceAlert() {
    const alertElement = document.getElementById('service-alert');
    const messageElement = document.getElementById('service-message');
    
    const hasInstalledBefore = localStorage.getItem('client_installed') === 'true';
    
    if (hasInstalledBefore) {
        alertElement.className = 'alert alert-warning';
        messageElement.innerHTML = `
            <strong>本地服务未运行</strong><br>
            请启动理财查询助手客户端，或重新下载安装最新版本。
            <a href="#" onclick="showTab('download')" class="alert-link">前往下载页面</a>
        `;
    } else {
        alertElement.className = 'alert alert-info';
        messageElement.innerHTML = `
            <strong>欢迎使用理财产品查询工具</strong><br>
            首次使用需要下载安装客户端程序，
            <a href="#" onclick="showTab('download')" class="alert-link">点击这里下载安装</a>
        `;
    }
    
    alertElement.classList.remove('d-none');
}

/**
 * 更新按钮状态
 */
function updateButtonStates() {
    const initBtn = document.getElementById('init-btn');
    const singleQueryBtn = document.getElementById('single-query-btn');
    const batchQueryBtn = document.getElementById('batch-query-btn');
    const browserSelect = document.getElementById('browser-select');
    
    if (!serviceConnected) {
        // 服务未连接
        initBtn.disabled = true;
        initBtn.innerHTML = '<i class="fas fa-times me-2"></i>服务未连接';
        singleQueryBtn.disabled = true;
        batchQueryBtn.disabled = true;
        browserSelect.disabled = true;
    } else if (!browserInitialized) {
        // 服务已连接但浏览器未初始化
        initBtn.disabled = false;
        initBtn.innerHTML = '<i class="fas fa-play me-2"></i>初始化浏览器';
        singleQueryBtn.disabled = true;
        batchQueryBtn.disabled = true;
        browserSelect.disabled = false;
    } else {
        // 服务已连接且浏览器已初始化
        initBtn.disabled = false;
        initBtn.innerHTML = '<i class="fas fa-sync me-2"></i>重新初始化';
        singleQueryBtn.disabled = false;
        batchQueryBtn.disabled = false;
        browserSelect.disabled = false;
    }
}

/**
 * 初始化浏览器
 */
async function initializeBrowser() {
    if (!serviceConnected) {
        showAlert('请先启动本地服务', 'danger');
        return;
    }
    
    const browserType = document.getElementById('browser-select').value;
    const initBtn = document.getElementById('init-btn');
    
    // 显示加载状态
    showLoading('初始化浏览器', `正在启动${getBrowserName(browserType)}浏览器...`);
    initBtn.disabled = true;
    initBtn.innerHTML = '<div class="loading-spinner me-2"></div>初始化中...';
    
    try {
        const response = await fetch(`${API_BASE}/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ browser: browserType })
        });
        
        const result = await response.json();
        
        if (result.success) {
            browserInitialized = true;
            showAlert(`${getBrowserName(browserType)}浏览器初始化成功`, 'success');
            updateButtonStates();
        } else {
            showAlert(`初始化失败: ${result.message}`, 'danger');
            browserInitialized = false;
            updateButtonStates();
        }
        
    } catch (error) {
        showAlert(`初始化失败: ${error.message}`, 'danger');
        browserInitialized = false;
        updateButtonStates();
    } finally {
        hideLoading();
        updateButtonStates();
    }
}

/**
 * 单个查询
 */
async function querySingle() {
    const codeInput = document.getElementById('single-code-input');
    const code = codeInput.value.trim();
    
    if (!code) {
        showAlert('请输入产品登记编码', 'warning');
        codeInput.focus();
        return;
    }
    
    if (!browserInitialized) {
        showAlert('请先初始化浏览器', 'warning');
        return;
    }
    
    // 显示加载状态
    showLoading('查询产品', `正在查询编码: ${code}`);
    
    try {
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: code })
        });
        
        const result = await response.json();
        
        if (result.success) {
            queryResults = [result.data];
            displayResults(queryResults);
            showAlert('查询成功', 'success');
            codeInput.value = '';
        } else {
            if (result.need_captcha) {
                showAlert('出现验证码，请在浏览器中处理后重试', 'warning');
            } else if (result.not_found) {
                showAlert('未找到匹配的产品', 'warning');
            } else {
                showAlert(`查询失败: ${result.message}`, 'danger');
            }
        }
        
    } catch (error) {
        showAlert(`查询失败: ${error.message}`, 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * 批量查询
 */
async function queryBatch() {
    const codesInput = document.getElementById('batch-codes-input');
    const codesText = codesInput.value.trim();
    
    if (!codesText) {
        showAlert('请输入产品编码列表', 'warning');
        codesInput.focus();
        return;
    }
    
    if (!browserInitialized) {
        showAlert('请先初始化浏览器', 'warning');
        return;
    }
    
    // 解析编码列表
    const codes = codesText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (codes.length === 0) {
        showAlert('没有找到有效的产品编码', 'warning');
        return;
    }
    
    if (codes.length > 50) {
        showAlert('批量查询最多支持50个编码，请分批处理', 'warning');
        return;
    }
    
    // 显示进度条
    showBatchProgress(codes.length);
    
    try {
        const response = await fetch(`${API_BASE}/batch_query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ codes: codes })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 处理结果
            const successResults = result.results
                .filter(item => item.success)
                .map(item => item.data);
                
            const failedCount = result.results.filter(item => !item.success).length;
            
            if (successResults.length > 0) {
                queryResults = successResults;
                displayResults(queryResults);
            }
            
            // 显示统计信息
            const message = `批量查询完成：成功 ${successResults.length} 个，失败 ${failedCount} 个`;
            showAlert(message, successResults.length > 0 ? 'success' : 'warning');
            
            if (successResults.length > 0) {
                codesInput.value = '';
            }
            
        } else {
            showAlert(`批量查询失败: ${result.message}`, 'danger');
        }
        
    } catch (error) {
        showAlert(`批量查询失败: ${error.message}`, 'danger');
    } finally {
        hideBatchProgress();
    }
}

/**
 * 显示批量查询进度
 */
function showBatchProgress(total) {
    const batchQueryBtn = document.getElementById('batch-query-btn');
    const progressDiv = document.getElementById('batch-progress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    
    batchQueryBtn.disabled = true;
    batchQueryBtn.innerHTML = '<div class="loading-spinner me-2"></div>查询中...';
    
    progressDiv.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressBar.textContent = `0/${total}`;
    
    // 模拟进度更新（实际应用中需要WebSocket或轮询）
    let current = 0;
    const interval = setInterval(() => {
        if (current >= total) {
            clearInterval(interval);
            return;
        }
        current++;
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${current}/${total}`;
    }, 2000); // 每2秒更新一次进度
}

/**
 * 隐藏批量查询进度
 */
function hideBatchProgress() {
    const batchQueryBtn = document.getElementById('batch-query-btn');
    const progressDiv = document.getElementById('batch-progress');
    
    batchQueryBtn.disabled = false;
    batchQueryBtn.innerHTML = '<i class="fas fa-list me-2"></i>开始批量查询';
    progressDiv.classList.add('d-none');
}

/**
 * 显示查询结果
 */
function displayResults(results) {
    if (!results || results.length === 0) {
        return;
    }
    
    const resultPanel = document.getElementById('result-panel');
    const resultContent = document.getElementById('result-content');
    
    // 生成表格HTML
    const tableHtml = generateResultTable(results);
    resultContent.innerHTML = tableHtml;
    
    // 显示结果面板
    resultPanel.classList.remove('d-none');
    
    // 滚动到结果区域
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 生成结果表格
 */
function generateResultTable(results) {
    if (results.length === 0) {
        return '<p class="text-center text-muted">暂无数据</p>';
    }
    
    // 获取所有字段名
    const fields = Object.keys(results[0]);
    
    let html = '<table class="table table-striped table-hover">';
    
    // 表头
    html += '<thead><tr>';
    fields.forEach(field => {
        html += `<th>${field}</th>`;
    });
    html += '</tr></thead>';
    
    // 表体
    html += '<tbody>';
    results.forEach((result, index) => {
        html += '<tr>';
        fields.forEach(field => {
            const value = result[field] || '';
            html += `<td title="${value}">${value}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    
    return html;
}

/**
 * 导出结果为Excel
 */
function exportResults() {
    if (!queryResults || queryResults.length === 0) {
        showAlert('没有可导出的数据', 'warning');
        return;
    }
    
    try {
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(queryResults);
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "查询结果");
        
        // 生成文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `理财产品查询结果_${timestamp}.xlsx`;
        
        // 下载文件
        XLSX.writeFile(wb, filename);
        
        showAlert('结果已导出到Excel文件', 'success');
        
    } catch (error) {
        showAlert(`导出失败: ${error.message}`, 'danger');
    }
}

/**
 * 切换查询模式
 */
function toggleQueryMode(mode) {
    const singlePanel = document.getElementById('single-query-panel');
    const batchPanel = document.getElementById('batch-query-panel');
    
    if (mode === 'single') {
        singlePanel.classList.remove('d-none');
        batchPanel.classList.add('d-none');
    } else {
        singlePanel.classList.add('d-none');
        batchPanel.classList.remove('d-none');
    }
}

/**
 * 切换标签页
 */
function showTab(tabName) {
    // 隐藏所有标签页内容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('d-none');
    });
    
    // 显示指定标签页
    document.getElementById(tabName + '-tab').classList.remove('d-none');
    
    // 更新导航栏状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 设置当前标签页为活跃状态
    const activeLink = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentTab = tabName;
}

/**
 * 下载客户端
 */
function downloadClient() {
    // 标记用户已下载过
    localStorage.setItem('client_installed', 'true');
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = CLIENT_DOWNLOAD_URL;
    link.download = '理财查询助手.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('下载已开始，请运行下载的程序完成安装', 'info');
    
    // 3秒后开始检查服务状态
    setTimeout(() => {
        showAlert('安装完成后，程序将自动启动。如未自动启动，请手动运行客户端。', 'info');
        checkServiceStatus();
    }, 3000);
}

/**
 * 显示加载模态框
 */
function showLoading(title, message) {
    document.getElementById('loading-title').textContent = title;
    document.getElementById('loading-message').textContent = message;
    
    const modal = new bootstrap.Modal(document.getElementById('loading-modal'));
    modal.show();
}

/**
 * 隐藏加载模态框
 */
function hideLoading() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loading-modal'));
    if (modal) {
        modal.hide();
    }
}

/**
 * 显示提示消息
 */
function showAlert(message, type = 'info') {
    // 创建提示元素
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 9999; max-width: 400px;';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

/**
 * 获取浏览器名称
 */
function getBrowserName(browserType) {
    const names = {
        'firefox': 'Firefox',
        'chrome': 'Chrome',
        'edge': 'Edge'
    };
    return names[browserType] || browserType;
}

/**
 * 工具函数：格式化时间
 */
function formatTime(date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * 工具函数：防抖
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}