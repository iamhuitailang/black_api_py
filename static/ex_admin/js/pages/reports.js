var ReportsPage = {
    currentPage: 1,
    pageSize: 10,
    statusFilter: '',
    typeFilter: '',
    
    typeMap: {
        1: '违规物品',
        2: '虚假信息',
        3: '恶意行为',
        4: '其他问题'
    },
    
    statusMap: {
        1: { text: '待处理', class: 'badge-warning' },
        2: { text: '已处理', class: 'badge-success' },
        3: { text: '已驳回', class: 'badge-secondary' }
    },
    
    render: function() {
        if (!Auth.checkAuth()) return;
        
        var content = `
            <div class="page-header">
                <h2 class="page-title">举报处理</h2>
                <p class="page-subtitle">处理用户举报，维护平台秩序</p>
            </div>
            <div class="toolbar">
                <div class="toolbar-left">
                    <select class="form-control" id="statusFilter" style="min-width: 120px;">
                        <option value="">全部状态</option>
                        <option value="1">待处理</option>
                        <option value="2">已处理</option>
                        <option value="3">已驳回</option>
                    </select>
                    <select class="form-control" id="typeFilter" style="min-width: 120px;">
                        <option value="">全部类型</option>
                        <option value="1">违规物品</option>
                        <option value="2">虚假信息</option>
                        <option value="3">恶意行为</option>
                        <option value="4">其他问题</option>
                    </select>
                    <button class="btn btn-primary" id="searchBtn">筛选</button>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>举报ID</th>
                                    <th>举报类型</th>
                                    <th>举报人</th>
                                    <th>被举报用户</th>
                                    <th>状态</th>
                                    <th>举报时间</th>
                                    <th>处理时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="reportTableBody">
                                <tr>
                                    <td colspan="8" class="text-center">
                                        <span class="loading"></span> 加载中...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>
            
            <div class="modal-overlay" id="reportDetailModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">举报详情</h3>
                        <button class="modal-close" onclick="ReportsPage.closeDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body" id="reportDetailContent">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ReportsPage.closeDetailModal()">关闭</button>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="processReportModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">处理举报</h3>
                        <button class="modal-close" onclick="ReportsPage.closeProcessModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">处理结果 <span class="required">*</span></label>
                            <select class="form-control" id="processStatus">
                                <option value="2">处理完成</option>
                                <option value="3">驳回举报</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">处理备注</label>
                            <textarea class="form-control" id="processRemark" placeholder="请输入处理备注..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ReportsPage.closeProcessModal()">取消</button>
                        <button class="btn btn-primary" id="submitProcessBtn">确认处理</button>
                    </div>
                </div>
            </div>
        `;
        
        Layout.render('/reports', content);
        Layout.setPageTitle('举报处理');
        
        this.bindEvents();
        this.loadReports();
    },
    
    bindEvents: function() {
        var self = this;
        
        document.getElementById('searchBtn').addEventListener('click', function() {
            self.statusFilter = document.getElementById('statusFilter').value;
            self.typeFilter = document.getElementById('typeFilter').value;
            self.currentPage = 1;
            self.loadReports();
        });
        
        document.getElementById('submitProcessBtn').addEventListener('click', function() {
            var status = document.getElementById('processStatus').value;
            var remark = document.getElementById('processRemark').value.trim();
            
            if (!self.currentReportId) {
                Toast.error('请选择要处理的举报');
                return;
            }
            
            API.post('/ex/admin/report/process', {
                report_id: self.currentReportId,
                status: parseInt(status),
                remark: remark
            })
                .then(function() {
                    Toast.success('处理成功');
                    self.closeProcessModal();
                    self.loadReports();
                })
                .catch(function(error) {
                    Toast.error(error.message || '处理失败');
                });
        });
    },
    
    loadReports: function() {
        var self = this;
        var url = '/ex/admin/report/list/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        
        if (this.statusFilter) {
            url += '&status=' + this.statusFilter;
        }
        if (this.typeFilter) {
            url += '&type=' + this.typeFilter;
        }
        
        API.get(url)
            .then(function(response) {
                var data = response.data;
                var reports = data.list || data;
                var total = data.total || reports.length;
                
                self.renderTable(reports);
                self.renderPagination(total);
            })
            .catch(function(error) {
                console.error('加载举报列表失败:', error);
                var tbody = document.getElementById('reportTableBody');
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="empty-state">
                                <div class="icon">❌</div>
                                <p>加载失败: ` + (error.message || '未知错误') + `</p>
                            </div>
                        </td>
                    </tr>
                `;
            });
    },
    
    renderTable: function(reports) {
        var tbody = document.getElementById('reportTableBody');
        
        if (!reports || reports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="empty-state">
                            <div class="icon">⚠️</div>
                            <p>暂无举报数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        var html = '';
        reports.forEach(function(report) {
            var status = ReportsPage.statusMap[report.status] || { text: '未知', class: 'badge-warning' };
            var type = ReportsPage.typeMap[report.type] || '未知';
            
            var actionBtns = '<button class="btn btn-sm btn-info" onclick="ReportsPage.viewDetail(' + report.id + ')">详情</button>';
            if (report.status === 1) {
                actionBtns += '<button class="btn btn-sm btn-primary" onclick="ReportsPage.process(' + report.id + ')">处理</button>';
            }
            
            html += `
                <tr>
                    <td>#` + report.id + `</td>
                    <td>` + type + `</td>
                    <td>` + (report.reporter_nickname || report.reporter_phone || '-') + `</td>
                    <td>` + (report.target_nickname || report.target_phone || '-') + `</td>
                    <td><span class="badge ` + status.class + `">` + status.text + `</span></td>
                    <td>` + (report.created_at || '-') + `</td>
                    <td>` + (report.processed_at || '-') + `</td>
                    <td>
                        <div class="table-actions">
                            ` + actionBtns + `
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    },
    
    renderPagination: function(total) {
        var container = document.getElementById('pagination');
        var totalPages = Math.ceil(total / this.pageSize);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        var self = this;
        var html = '';
        
        html += '<button class="pagination-btn" onclick="ReportsPage.goToPage(' + (this.currentPage - 1) + ')" ' + (this.currentPage === 1 ? 'disabled' : '') + '>‹</button>';
        
        var startPage = Math.max(1, this.currentPage - 2);
        var endPage = Math.min(totalPages, startPage + 4);
        
        if (startPage > 1) {
            html += '<button class="pagination-btn" onclick="ReportsPage.goToPage(1)">1</button>';
            if (startPage > 2) {
                html += '<span class="pagination-info">...</span>';
            }
        }
        
        for (var i = startPage; i <= endPage; i++) {
            html += '<button class="pagination-btn ' + (i === this.currentPage ? 'active' : '') + '" onclick="ReportsPage.goToPage(' + i + ')">' + i + '</button>';
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="pagination-info">...</span>';
            }
            html += '<button class="pagination-btn" onclick="ReportsPage.goToPage(' + totalPages + ')">' + totalPages + '</button>';
        }
        
        html += '<button class="pagination-btn" onclick="ReportsPage.goToPage(' + (this.currentPage + 1) + ')" ' + (this.currentPage === totalPages ? 'disabled' : '') + '>›</button>';
        html += '<span class="pagination-info">共 ' + total + ' 条</span>';
        
        container.innerHTML = html;
    },
    
    goToPage: function(page) {
        this.currentPage = page;
        this.loadReports();
    },
    
    viewDetail: function(reportId) {
        var modal = document.getElementById('reportDetailModal');
        var content = document.getElementById('reportDetailContent');
        
        content.innerHTML = '<div class="text-center"><span class="loading"></span> 加载中...</div>';
        modal.classList.add('show');
        
        API.get('/ex/admin/report/detail/get?id=' + reportId)
            .then(function(response) {
                var report = response.data;
                
                var type = ReportsPage.typeMap[report.type] || '未知';
                var status = ReportsPage.statusMap[report.status] || { text: '未知', class: 'badge-warning' };
                
                content.innerHTML = `
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">举报类型</label>
                            <div style="padding:8px 0;">` + type + `</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <div style="padding:8px 0;"><span class="badge ` + status.class + `">` + status.text + `</span></div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">举报人</label>
                            <div style="padding:8px 0;">` + (report.reporter_nickname || report.reporter_phone || '-') + `</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">被举报用户</label>
                            <div style="padding:8px 0;">` + (report.target_nickname || report.target_phone || '-') + `</div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">举报原因</label>
                        <div style="padding:8px 0;white-space:pre-wrap;">` + (report.reason || '-') + `</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">举报时间</label>
                            <div style="padding:8px 0;">` + (report.created_at || '-') + `</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">处理时间</label>
                            <div style="padding:8px 0;">` + (report.processed_at || '-') + `</div>
                        </div>
                    </div>
                    ` + (report.remark ? `
                    <div class="form-group">
                        <label class="form-label">处理备注</label>
                        <div style="padding:8px 0;white-space:pre-wrap;">` + report.remark + `</div>
                    </div>
                    ` : '') + `
                `;
            })
            .catch(function(error) {
                content.innerHTML = '<div class="text-center text-danger">加载失败: ' + (error.message || '未知错误') + '</div>';
            });
    },
    
    closeDetailModal: function() {
        document.getElementById('reportDetailModal').classList.remove('show');
    },
    
    currentReportId: null,
    
    process: function(reportId) {
        this.currentReportId = reportId;
        document.getElementById('processStatus').value = '2';
        document.getElementById('processRemark').value = '';
        document.getElementById('processReportModal').classList.add('show');
    },
    
    closeProcessModal: function() {
        this.currentReportId = null;
        document.getElementById('processReportModal').classList.remove('show');
    }
};
