export interface CreateParams<T> {
  body: T;
  source?: string[];
  idempotency?: string;
}

export interface UpdateParams<T> {
  idempotency?: string;
  body: Partial<T>;
}

export interface ActionParams<T> {
  idempotency?: string;
  body: Partial<T>;
}

export interface GetParams {
  id: string;
  source?: string[];
}

export interface GetAllParams {
  from: number;
  size: number;
  source?: string[];
}

export type SortParam = { field: string; order: 'asc' | 'desc' }[];

export interface SearchParams {
  query?: string;
  filters?: { [key: string]: any };
  from: number;
  size: number;
  sort?: SortParam;
  source?: string[];
}

export interface SearchResponse<T> {
  from: number;
  size: number;
  total: number;
  hits: T[];
}

export interface IntegerRange {
  gte: number;
  lte: number;
}

export interface Circle {
  type: 'circle';
  radius: string;
  coordinates: number[];
}

export interface SellerCredentials {
  access_token: string;
  expires_in: number;
  live_mode: boolean;
  public_key: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  user_id: number;
}

export interface DeliveryArea {
  center: Place;
  radius: string;
  geometry: Circle;
}

export type OpeningHours = {
  day: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  open: number;
  close: number;
}[];

export interface Card {
  id: string;
  customer_id: string;
  expiration_month: number;
  expiration_year: number;
  first_six_digits: string;
  last_four_digits: string;
  payment_method: {
    id: string;
    name: string;
    payment_type_id: string;
    thumbnail: string;
    secure_thumbnail: string;
  };
  security_code: {
    length: number;
    card_location: string;
  };
  issuer: {
    id: number;
    name: string;
  };
  cardholder: {
    name: string;
    identification: {
      number: string;
      type: string;
    };
  };
  live_mode: boolean;
  date_created: string;
  date_last_updated: string;
}

export interface Place {
  id: string;
  url: string;
  street_number: AddressProp;
  route: AddressProp;
  locality: AddressProp;
  administrative_area_level_3: AddressProp;
  administrative_area_level_2: AddressProp;
  administrative_area_level_1: AddressProp;
  apartment: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
}

export interface AddressProp {
  short_name: string;
  long_name: string;
}

export enum PaymentProvider {
  MERCADOPAGO = 'mercadopago',
}

export enum DispatchProvider {
  OWNER = 'owner',
}

export interface Store {
  id: string;
  version: number;
  name: string;
  phone: string;
  images: string[];
  delivery_time: IntegerRange;
  delivery_area: DeliveryArea;
  opening_hours: OpeningHours;
  seller_credentials: SellerCredentials;
  payment_provider: PaymentProvider;
  dispatch_provider: DispatchProvider;
}

export interface Product {
  id: string;
  type: 'product';
  name: string;
  description: string;
  images: string[];
  price: number;
  brand?: string;
  tags?: string[];
  enabled: boolean;
  store: Store;
}

export interface Service {
  id: string;
  type: 'service';
  name: string;
  description: string;
  images: string[];
  price: number | null;
  tags?: string[];
  enabled: boolean;
  store: Store;
}

export interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  phone: string;
}

export interface Item extends Omit<Product, 'store'> {
  qty: number;
}

export interface Transaction {
  country: string;
  currency: string;
  language: string;
  delivery_address: Place;
  shopping_cart: Item[];
  store: Store;
}

export interface CreatePayment {
  customer: Customer;
  transaction: Transaction;
  redirect_url: string;
}

export interface CreateCheckout {
  reference: string;
  customer: Customer;
  transaction: Transaction;
  redirect_url: string;
}

export enum MercadopagoPaymentStatus {
  STARTED = 'started',
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back',
}

export type PaymentProviderState = {
  id: PaymentProvider.MERCADOPAGO;
  status: MercadopagoPaymentStatus;
  checkout: { id: string; init_point: string };
  data: { [key: string]: any };
};

export enum PaymentStatus {
  CREATED = 'created',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface Payment extends CreatePayment {
  id: string;
  reference: string;
  status: PaymentStatus;
  provider: PaymentProviderState;
  idempotency?: string;
  created_at: Date;
  updated_at: Date;
}

export enum OrderStatus {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ProductConfirmationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  REPLACE = 'replace',
}

export type ProductConfirmation =
  | { type: ProductConfirmationType.UPDATE; id: string; qty_posible: number }
  | { type: ProductConfirmationType.DELETE; id: string };

export type Confirmation = ProductConfirmation[];

export enum OwnerDispatchStatus {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface DispatchProviderState {
  id: DispatchProvider.OWNER;
  status: OwnerDispatchStatus;
  confirmation?: Confirmation;
}

export interface CreateOrder {
  reference: string;
  customer: Customer;
  transaction: Transaction;
  idempotency?: string;
}

export interface Order extends CreateOrder {
  id: string;
  status: OrderStatus;
  provider: DispatchProviderState;
  created_at: Date;
  updated_at: Date;
}
