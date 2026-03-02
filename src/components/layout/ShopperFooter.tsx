import Link from "next/link";

export default function ShopperFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-lg font-bold text-primary-600">Pabakal</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Wala diyan? Kami na. Quality US products delivered to the Philippines.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Shop</h4>
            <ul className="mt-2 space-y-1">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/electronics"
                  className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400"
                >
                  Electronics
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/beauty-skincare"
                  className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400"
                >
                  Beauty & Skincare
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Help</h4>
            <ul className="mt-2 space-y-1">
              <li>
                <Link
                  href="/orders"
                  className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400"
                >
                  Track My Order
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400"
                >
                  My Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-4 dark:border-gray-800">
          <p className="text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Pabakal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
