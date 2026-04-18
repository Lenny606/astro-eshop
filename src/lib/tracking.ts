/**
 * DataLayer Helper for GTM/GA4
 */

export const pushToDataLayer = (event: string, data: Record<string, any> = {}) => {
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event,
      ...data,
    });
  }
};

/**
 * Ecommerce Events
 */

export const trackViewItemList = (items: any[], listName: string = 'Product List') => {
  pushToDataLayer('view_item_list', {
    ecommerce: {
      item_list_name: listName,
      items: items.map((item, index) => ({
        item_id: item.id,
        item_name: item.name,
        index,
        item_brand: 'Astro Shop',
        item_category: item.category?.name,
        price: item.price / 100,
        quantity: 1,
      })),
    },
  });
};

export const trackViewItem = (item: any) => {
  pushToDataLayer('view_item', {
    ecommerce: {
      currency: 'CZK',
      value: item.price / 100,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_brand: 'Astro Shop',
          item_category: item.category?.name,
          price: item.price / 100,
          quantity: 1,
        },
      ],
    },
  });
};

export const trackAddToCart = (item: any, quantity: number = 1) => {
  pushToDataLayer('add_to_cart', {
    ecommerce: {
      currency: 'CZK',
      value: (item.price * quantity) / 100,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_brand: 'Astro Shop',
          item_category: item.category?.name,
          price: item.price / 100,
          quantity: quantity,
        },
      ],
    },
  });
};

export const trackBeginCheckout = (items: any[]) => {
  const value = items.reduce((acc, item) => acc + (item.price * item.quantity), 0) / 100;
  pushToDataLayer('begin_checkout', {
    ecommerce: {
      currency: 'CZK',
      value,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_brand: 'Astro Shop',
        item_category: item.category?.name,
        price: item.price / 100,
        quantity: item.quantity,
      })),
    },
  });
};

export const trackPurchase = (orderId: string, items: any[]) => {
  const value = items.reduce((acc, item) => acc + (item.price * item.quantity), 0) / 100;
  pushToDataLayer('purchase', {
    ecommerce: {
      transaction_id: orderId,
      value,
      tax: 0,
      shipping: 0,
      currency: 'CZK',
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_brand: 'Astro Shop',
        item_category: item.category?.name,
        price: item.price / 100,
        quantity: item.quantity,
      })),
    },
  });
};
