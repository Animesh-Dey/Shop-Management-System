import { forwardRef } from 'react';

const Invoice = forwardRef(function Invoice({ sale, user }, ref) {
  if (!sale) return null;
  const fmt = (n) => Number(n || 0).toFixed(2);
  return (
    <div ref={ref} className="print-area bg-white text-black p-4 mx-auto" style={{ maxWidth: '80mm', fontFamily: 'monospace' }}>
      <div className="text-center">
        <div className="font-bold text-lg">{user?.shopName || 'Grocery Shop'}</div>
        {user?.shopAddress && <div className="text-xs">{user.shopAddress}</div>}
        {user?.shopPhone && <div className="text-xs">Ph: {user.shopPhone}</div>}
        {user?.gstNumber && <div className="text-xs">GST: {user.gstNumber}</div>}
      </div>
      <hr className="my-2 border-dashed border-black" />
      <div className="text-xs">
        <div>Invoice: {sale.invoiceNumber}</div>
        <div>Date: {new Date(sale.saleDate).toLocaleString()}</div>
        {sale.customerName && <div>Customer: {sale.customerName}</div>}
        {sale.customerPhone && <div>Phone: {sale.customerPhone}</div>}
      </div>
      <hr className="my-2 border-dashed border-black" />
      <table className="w-full text-xs">
        <thead>
          <tr><th className="text-left">Item</th><th className="text-right">Qty</th><th className="text-right">Amt</th></tr>
        </thead>
        <tbody>
          {sale.items.map((it, i) => (
            <tr key={i}>
              <td className="pr-1">
                <div>{it.productName}</div>
                <div className="text-[10px]">@ ₹{fmt(it.sellingPrice)}</div>
              </td>
              <td className="text-right align-top">{it.quantity} {it.unit}</td>
              <td className="text-right align-top">₹{fmt(it.itemTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-2 border-dashed border-black" />
      <div className="text-xs space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>₹{fmt(sale.subtotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>₹{fmt(sale.discount)}</span></div>
        <div className="flex justify-between font-bold text-sm"><span>Grand Total</span><span>₹{fmt(sale.grandTotal)}</span></div>
      </div>
      <hr className="my-2 border-dashed border-black" />
      <div className="text-center text-xs mt-2">Thank you! Visit again.</div>
    </div>
  );
});

export default Invoice;
