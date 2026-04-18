import { server } from '../actions/index';

async function testAction() {
  console.log('Testing simulateOrder action...');
  try {
    const result = await (server.simulateOrder as any).handler({
      items: [
        { id: 'klavesnice-3', quantity: 1 },
        { id: 'klavesnice-4', quantity: 1 }
      ],
      customer: {
        email: 'thomas.test@gmail.com',
        name: 'Test Test',
        street: 'Test 12',
        city: 'Prague',
        psc: '12345',
        paymentMethod: 'karta'
      }
    });
    console.log('Action SUCCESS:', result);
  } catch (error) {
    console.error('Action FAILED:', error);
  }
}

testAction();
