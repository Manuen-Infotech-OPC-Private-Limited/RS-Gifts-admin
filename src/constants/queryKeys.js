export const adminQueryKeys = {
  stats: ['admin', 'stats'],
  products: {
    all: ['admin', 'products'],
    detail: (id) => ['admin', 'products', id],
  },
  categories: ['admin', 'categories'],
  occasions: ['admin', 'occasions'],
  orders: {
    all: ['admin', 'orders'],
    detail: (id) => ['admin', 'orders', id],
  },
  customers: {
    all: ['admin', 'customers'],
    detail: (id) => ['admin', 'customers', id],
  },
  coupons: ['admin', 'coupons'],
  banners: ['admin', 'banners'],
  reviews: ['admin', 'reviews'],
  inquiries: ['admin', 'inquiries'],
  settings: ['admin', 'settings'],
  sessions: ['admin', 'sessions'],
};

export default adminQueryKeys;
