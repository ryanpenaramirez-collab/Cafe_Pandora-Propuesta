/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Table, StockItem, SystemAlert } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'p1',
    name: 'Croque Monsieur Classique',
    price: 32000,
    category: 'platillo',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=400&q=80',
    description: 'Sándwich de pan de masa madre con jamón york ahumado, queso Gruyère y salsa bechamel gratinada.',
    available: true,
    stock: 25
  },
  {
    id: 'p2',
    name: 'Tarta de Manzana y Especias',
    price: 18000,
    category: 'platillo',
    image: 'https://images.unsplash.com/photo-1507226983735-a838615193b0?auto=format&fit=crop&w=400&q=80',
    description: 'Hojaldre de manzana fresca bañado en almíbar de canela, servido caliente con helado de vainilla.',
    available: true,
    stock: 12
  },
  {
    id: 'p3',
    name: 'Pan de Bono de la Casa',
    price: 6000,
    category: 'platillo',
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80',
    description: 'Panecillo esponjoso tradicional de fécula de maíz y queso fresco de cabra, servido calientito.',
    available: true,
    stock: 40
  },
  {
    id: 'p4',
    name: 'Ensalada Pandora Gourmet',
    price: 28000,
    category: 'platillo',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
    description: 'Arúgula fresca, higos negros carnosos, queso de cabra artesanal, nueces tostadas y vinagreta de miel trufada.',
    available: true,
    stock: 15
  },
  {
    id: 'p5',
    name: 'Croissant Frangipane de Almendras',
    price: 12000,
    category: 'platillo',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
    description: 'Hojaldre crocante de mantequilla francesa relleno de crema dulce de almendras y decorado con almendras fileteadas.',
    available: true,
    stock: 18
  },
  {
    id: 'p6',
    name: 'Crepa Suprema de Frutos Rojos',
    price: 22000,
    category: 'platillo',
    image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=400&q=80',
    description: 'Crepa fina rellena de compota casera de fresas, moras, chocolate blanco flameado y helado de frambuesa dulce.',
    available: true,
    stock: 20
  }
];

export const INITIAL_BEVERAGES: MenuItem[] = [
  {
    id: 'b1',
    name: 'Espresso Pandora',
    price: 7500,
    category: 'bebida',
    image: 'https://images.unsplash.com/photo-1510972527409-cac5cbff0312?auto=format&fit=crop&w=400&q=80',
    description: 'Doble ristretto extraído a presión perfecta con granos de origen único seleccionados de Chiapas.',
    available: true,
    stock: 150
  },
  {
    id: 'b2',
    name: 'Capuccino Amaretto',
    price: 11000,
    category: 'bebida',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=400&q=80',
    description: 'Expreso con leche texturizada perfectamente sedosa, un toque sutil de licor de almendras y cacao espolvoreado.',
    available: true,
    stock: 100
  },
  {
    id: 'b3',
    name: 'Café de Olla Orgánico',
    price: 9500,
    category: 'bebida',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80',
    description: 'Infusión lenta en jarro de barro con piloncillo de caña puro, canela fina entera y ralladura de naranja dulce.',
    available: true,
    stock: 80
  },
  {
    id: 'b4',
    name: 'Dirty Chai Tea Latte',
    price: 14500,
    category: 'bebida',
    image: 'https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?auto=format&fit=crop&w=400&q=80',
    description: 'Té negro aromático con especias calientes de Mysore, leche cremosa de avena y un shot extra de expreso.',
    available: true,
    stock: 65
  },
  {
    id: 'b5',
    name: 'Cold Brew Citrus Tonic',
    price: 15500,
    category: 'bebida',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
    description: 'Filtro en frío durante 18 horas sobre agua tónica burbujeante premium, hielo cristalino y un gajo fresco de pomelo.',
    available: true,
    stock: 45
  },
  {
    id: 'b6',
    name: 'Infusión Especial Pétalos de Rosa',
    price: 11500,
    category: 'bebida',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    description: 'Mezcla exótica floral con hibisco rojo orgánico, manzana deshidratada, pétalos secos de rosa silvestre y toques cítricos.',
    available: true,
    stock: 70
  }
];

export const INITIAL_GASEOSAS: MenuItem[] = [
  {
    id: 'g1',
    name: 'Coca-Cola Sabor Original',
    price: 7200,
    category: 'gaseosa',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    description: 'Refrescante bebida gaseosa Coca-Cola Original de 330ml servida helada con gajo de limón.',
    available: true,
    stock: 90
  },
  {
    id: 'g2',
    name: 'Coca-Cola Sin Azúcar',
    price: 7200,
    category: 'gaseosa',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    description: 'El sabor inconfundible de Coca-Cola pero sin calorías, botella de 330ml heladita.',
    available: true,
    stock: 80
  },
  {
    id: 'g3',
    name: 'Sprite Lima-Limón',
    price: 6800,
    category: 'gaseosa',
    image: 'https://images.unsplash.com/photo-1625772291426-fbf0ca497b7b?auto=format&fit=crop&w=400&q=80',
    description: 'Bebida gaseosa sabor lima-limón, fresca y burbujeante, ideal para acompañar tus platos.',
    available: true,
    stock: 60
  },
  {
    id: 'g4',
    name: 'Quatro Toronja',
    price: 6800,
    category: 'gaseosa',
    image: 'https://images.unsplash.com/photo-1625772291426-fbf0ca497b7b?auto=format&fit=crop&w=400&q=80',
    description: 'Gaseosa sabor a toronja refrescante y ligeramente ácida de 330ml.',
    available: true,
    stock: 50
  },
  {
    id: 'g5',
    name: 'Agua Manantial con Gas',
    price: 6000,
    category: 'gaseosa',
    image: 'https://images.unsplash.com/photo-1608885898957-a599fb15ec3e?auto=format&fit=crop&w=400&q=80',
    description: 'Agua mineral de manantial 100% pura y gasificada, burbujas finas para limpiar el paladar.',
    available: true,
    stock: 120
  }
];

export const INITIAL_TABLES: Table[] = [
  { id: 1, name: 'Mesa 1 (Ventana)', capacity: 2, status: 'ocupada', currentWaiter: 'Meseros', totalAmount: 76000, ordersCount: 2, occupiedSince: '14:20' },
  { id: 2, name: 'Mesa 2 (Barra)', capacity: 1, status: 'vacía', totalAmount: 0, ordersCount: 0 },
  { id: 3, name: 'Mesa 3 (Interior)', capacity: 4, status: 'ocupada', currentWaiter: 'Meseros', totalAmount: 122000, ordersCount: 3, occupiedSince: '14:45' },
  { id: 4, name: 'Mesa 4 (Terraza)', capacity: 2, status: 'reservada', guestName: 'Diana R. - 16:30', totalAmount: 0, ordersCount: 0 },
  { id: 5, name: 'Mesa 5 (Ventana)', capacity: 2, status: 'por_pagar', currentWaiter: 'Andrea', totalAmount: 45000, ordersCount: 1, occupiedSince: '13:50' },
  { id: 6, name: 'Mesa 6 (Terraza)', capacity: 4, status: 'vacía', totalAmount: 0, ordersCount: 0 },
  { id: 7, name: 'Mesa 7 (Interior)', capacity: 6, status: 'vacía', totalAmount: 0, ordersCount: 0 },
  { id: 8, name: 'Mesa 8 (Sofá)', capacity: 4, status: 'ocupada', currentWaiter: 'Andrea', totalAmount: 98050, ordersCount: 2, occupiedSince: '14:35' },
  { id: 9, name: 'Mesa 9 (Barra)', capacity: 1, status: 'vacía', totalAmount: 0, ordersCount: 0 },
  { id: 10, name: 'Mesa 10 (Interior)', capacity: 2, status: 'vacía', totalAmount: 0, ordersCount: 0 },
  { id: 11, name: 'Mesa 11 (Terraza)', capacity: 2, status: 'reservada', guestName: 'Juan P. - 18:00', totalAmount: 0, ordersCount: 0 },
  { id: 12, name: 'Mesa 12 (Sofá VIP)', capacity: 6, status: 'vacía', totalAmount: 0, ordersCount: 0 }
];

export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'a-1',
    level: 'warning',
    message: 'Nivel bajo de grano de café Pandora Especial en tolva principal.',
    resolved: false,
    timestamp: '14:10'
  },
  {
    id: 'a-2',
    level: 'critical',
    message: 'Impresora térmica de FACTURAS trasera reporta atasco de papel.',
    resolved: false,
    timestamp: '14:35'
  },
  {
    id: 'a-3',
    level: 'info',
    message: 'Nueva reserva para Mesa 4 confirmada mediante app móvil.',
    resolved: false,
    timestamp: '14:55'
  }
];

export const INITIAL_STOCK: StockItem[] = [
  { id: 's1', name: 'Café Grano Pandora Especial', quantity: 18.5, minQuantity: 5.0, unit: 'kg', category: 'Granos' },
  { id: 's2', name: 'Leche de Almendra Barista', quantity: 24, minQuantity: 8, unit: 'L', category: 'Lácteos' },
  { id: 's3', name: 'Mantequilla Francesa AOP', quantity: 4.2, minQuantity: 10.0, unit: 'kg', category: 'Repostería' },
  { id: 's4', name: 'Queso Gruyère Importado', quantity: 3.5, minQuantity: 1.5, unit: 'kg', category: 'Ingredientes' },
  { id: 's5', name: 'Higos Frescos Orgánicos', quantity: 2.1, minQuantity: 1.0, unit: 'kg', category: 'Frutas' },
  { id: 's6', name: 'Masa Madre de Trigo', quantity: 12.0, minQuantity: 3.0, unit: 'kg', category: 'Panadería' },
  { id: 's7', name: 'Frutos Rojos Silvestres Sel.', quantity: 1.5, minQuantity: 2.5, unit: 'kg', category: 'Frutas' },
  { id: 's8', name: 'Té Chai Especial Mysore', quantity: 3.8, minQuantity: 1.2, unit: 'kg', category: 'Especias' }
];

export const STAFF_USERS = [
  { id: 'u1', name: 'Andres', role: 'administrador', email: 'andres@pandora.com', status: 'Activo', pin: '1234' },
  { id: 'u2', name: 'Laura Restrepo', role: 'administrador', email: 'laura@pandora.com', status: 'Activo', pin: '1234' },
  { id: 'u3', name: 'Meseros', role: 'mesero', email: 'luis@pandora.com', status: 'Activo', pin: '1234' },
  { id: 'u4', name: 'Sofía Valenzuela', role: 'administrador', email: 'sofia@pandora.com', status: 'Activo', pin: '1234' },
  { id: 'u5', name: 'Andrea Gómez', role: 'mesero', email: 'andrea@pandora.com', status: 'Activo', pin: '1234' }
];
