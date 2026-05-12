class VerifyPage {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('pageChanged', (e) => {
            if (e.detail === 'verify') {
                this.resetPage();
            }
        });

        this.bindEvents();
    }

    resetPage() {
        document.getElementById('verify-qrcode').value = '';
        document.getElementById('verify-result').innerHTML = '';
    }

    bindEvents() {
        document.getElementById('verify-btn').addEventListener('click', async () => {
            await this.verifyOrder();
        });

        document.getElementById('verify-qrcode').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.verifyOrder();
            }
        });
    }

    async verifyOrder() {
        const qrcode = document.getElementById('verify-qrcode').value.trim();

        if (!qrcode) {
            showToast('请输入取餐码', 'error');
            return;
        }

        const result = await OrderAdminAPI.orders.verify({
            qrcode: qrcode,
            verified_by: 1
        });

        const resultContainer = document.getElementById('verify-result');

        if (result.code === 0) {
            const orderResult = await OrderAdminAPI.orders.getByQrcode(qrcode);
            if (orderResult.code === 0) {
                const order = orderResult.data.order;
                const details = orderResult.data.details;

                resultContainer.className = 'verify-success';
                resultContainer.innerHTML = `
                    <h3 style="color: #155724; margin-bottom: 16px;">✅ 核销成功</h3>
                    <div class="verify-order-info">
                        <p><strong>订单号:</strong> ${order.order_no}</p>
                        <p><strong>日期:</strong> ${order.menu_date}</p>
                        <p><strong>餐段:</strong> ${getMealTypeName(order.meal_type)}</p>
                        <p><strong>金额:</strong> ${formatPrice(order.total_amount)}</p>
                        <p><strong>菜品:</strong></p>
                        <ul style="margin: 8px 0 8px 24px;">
                            ${details.map(d => `<li>${d.name} x ${d.quantity}</li>`).join('')}
                        </ul>
                    </div>
                `;
                showToast('核销成功');
            }
        } else {
            resultContainer.className = 'verify-error';
            resultContainer.innerHTML = `
                <h3 style="color: #721c24; margin-bottom: 16px;">❌ 核销失败</h3>
                <p>${result.msg || '核销失败'}</p>
            `;
            showToast(result.msg || '核销失败', 'error');
        }

        document.getElementById('verify-qrcode').value = '';
    }
}

let verifyPage;
document.addEventListener('DOMContentLoaded', () => {
    verifyPage = new VerifyPage();
});