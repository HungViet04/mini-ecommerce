/**
 * ProductDetailPage
 * Route container for /products/:id
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductDetail } from './ProductDetail';
import { productService } from '../../services';
import { useCart, useAuth, useNotification } from '../../contexts';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { isAdmin } = useAuth();
  const { notifyToast } = useNotification();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await productService.getById(id);
        if (!mounted) return;
        setProduct(data);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Không thể tải chi tiết sản phẩm.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleAddToCart = async (item) => {
    if (isAdmin) return;

    const cartItem = items.find((i) => i.productId === item.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const latest = await productService.getById(item.id);

    if (currentQty + 1 > latest.stock) {
      notifyToast(`Chỉ còn ${latest.stock} sản phẩm trong kho. Không thể thêm vượt quá.`, {
        type: 'error',
      });
      return;
    }

    addItem(item, 1);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Đang tải chi tiết sản phẩm...</div>;
  }

  if (error || !product) {
    return (
      <div className="product-detail">
        <button className="back-button" onClick={handleBack}>
          ← Quay lại danh sách sản phẩm
        </button>
        <div className="alert alert-error">{error || 'Không tìm thấy sản phẩm.'}</div>
      </div>
    );
  }

  return <ProductDetail product={product} onAddToCart={handleAddToCart} onBack={handleBack} />;
}

export default ProductDetailPage;
