import { CartProvider } from "@/components/cart/CartProvider";
import ShopperFooter from "@/components/layout/ShopperFooter";
import ShopperNavbar from "@/components/layout/ShopperNavbar";

export default function ShopperLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ShopperNavbar />
      <main className="flex-1">{children}</main>
      <ShopperFooter />
    </CartProvider>
  );
}
