import { server } from '../actions/index';
import { productRepository } from '../repositories/product.repository';

async function reproduceVulnerability() {
  console.log('--- Reproducing Negative Quantity Vulnerability ---');
  
  // 1. Get a real product ID
  const products = await productRepository.findAll();
  if (products.length < 1) {
    console.error('No products found to test with.');
    return;
  }
  const productId = products[0].id;
  console.log(`Using product: ${products[0].name} (ID: ${productId}, Price: ${products[0].price})`);

  try {
    // 2. Try to simulate an order with negative quantity
    const result = await (server.simulateOrder as any).handler({
      items: [
        { id: productId, quantity: -5 }
      ],
      customer: {
        email: 'vulnerability@test.com',
        name: 'Hacker',
        street: 'Darknet 666',
        city: 'Cybercity',
        psc: '00000',
        paymentMethod: 'karta'
      }
    });
    
    console.log('Vulnerability confirmed! Order created with negative quantity.');
    console.log('Result:', result);
    
  } catch (error) {
    console.log('Order failed (this is good, but check why):', error.message);
  }
}

reproduceVulnerability();
