/**
 * VNPayReturn Component
 * Handles VNPay payment return callback
 * Pattern: Container Component
 */
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { vnpayService } from '../../services/vnpay.service';
import { Card, Button } from '../ui';
import { formatPrice } from '../../utils';

export function VNPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Convert searchParams to object
        const params = {};
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }

        // Verify with backend
        const response = await vnpayService.verifyReturn(params);
        setResult(response);
      } catch (err) {
        setError(err.message || 'Không thể xác minh thanh toán');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleViewOrders = () => {
    navigate('/orders');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="vnpay-return-page">
        <Card className="vnpay-result-card">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang xác minh thanh toán...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vnpay-return-page">
        <Card className="vnpay-result-card">
          <div className="error-state">
            <div className="result-icon error">❌</div>
            <h1>Lỗi Xác Minh</h1>
            <p>{error}</p>
            <div className="result-actions">
              <Button variant="primary" onClick={handleViewOrders}>
                Xem Đơn Hàng
              </Button>
              <Button variant="outline" onClick={handleContinueShopping}>
                Tiếp Tục Mua Sắm
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="vnpay-return-page">
      <Card className="vnpay-result-card">
        {result?.isSuccess ? (
          <div className="success-state">
            <div className="result-icon success">✅</div>
            <h1>Thanh Toán Thành Công!</h1>
            <p className="result-message">{result.message}</p>

            <div className="payment-details">
              <div className="detail-row">
                <span>Mã đơn hàng:</span>
                <strong>#{result.orderId}</strong>
              </div>
              <div className="detail-row">
                <span>Số tiền:</span>
                <strong>{formatPrice(result.amount)}</strong>
              </div>
              <div className="detail-row">
                <span>Mã giao dịch:</span>
                <strong>{result.transactionNo}</strong>
              </div>
              <div className="detail-row">
                <span>Ngân hàng:</span>
                <strong>{result.bankCode}</strong>
              </div>
            </div>

            <div className="result-actions">
              <Button variant="primary" onClick={handleViewOrders}>
                Xem Đơn Hàng
              </Button>
              <Button variant="primary" onClick={handleContinueShopping}>
                Tiếp Tục Mua Sắm
              </Button>
            </div>
          </div>
        ) : (
          <div className="failed-state">
            <div className="result-icon failed">❌</div>
            <h1>Thanh Toán Thất Bại</h1>
            <p className="result-message">{result?.message || 'Giao dịch không thành công'}</p>

            {result?.orderId && (
              <div className="payment-details">
                <div className="detail-row">
                  <span>Mã đơn hàng:</span>
                  <strong>#{result.orderId}</strong>
                </div>
              </div>
            )}

            <p className="retry-note">
              Đơn hàng của bạn vẫn được lưu. Bạn có thể thanh toán lại từ trang đơn hàng.
            </p>

            <div className="result-actions">
              <Button variant="primary" onClick={handleViewOrders}>
                Xem Đơn Hàng
              </Button>
              <Button variant="outline" onClick={handleContinueShopping}>
                Tiếp Tục Mua Sắm
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default VNPayReturn;
