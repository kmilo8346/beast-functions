import { ExpoPushMessage } from "expo-server-sdk";

export interface CreateParams<T> {
  body: T;
  source?: string[];
}

export interface UpdateParams<T> {
  body: Partial<T>;
  source?: string[];
}

export interface ActionParams<T> {
  body?: Partial<T>;
  source?: string[];
}

export interface GetParams {
  source?: string[];
}

export interface SearchParams {
  query?: string;
  filters?: { [key: string]: any };
  from: number;
  size: number;
  sort?: { [key: string]: "asc" | "desc" };
  source?: string[];
  collapse?: {
    field: string;
    inner_hits?: {
      name: string;
      size?: number;
      sort?: string[];
      _source?: string[] | boolean;
    };
  };
}

export interface SearchResponse<T> {
  from: number;
  size: number;
  total: number;
  hits: (T & { inner_hits?: T[] })[];
  sort?: { [key: string]: "asc" | "desc" };
  query?: string;
  source?: string[];
  filters?: { [key: string]: any };
  collapse?: {
    field: string;
    inner_hits?: {
      name: string;
      size?: number;
      sort?: string[];
      _source?: string[] | boolean;
    };
  };
}

export interface IntegerRange {
  gte: number;
  lte: number;
}

export interface Circle {
  type: "circle";
  radius: string;
  coordinates: number[];
}

export interface MercadoPagoCredentials {
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
  day: "1" | "2" | "3" | "4" | "5" | "6" | "7";
  hours: { open: number; close: number }[];
}[];

export interface AddressProp {
  short_name: string;
  long_name: string;
}

export interface Place {
  id: string;
  url: string;
  street_number?: AddressProp;
  route?: AddressProp;
  locality: AddressProp;
  administrative_area_level_3: AddressProp;
  administrative_area_level_2: AddressProp;
  administrative_area_level_1: AddressProp;
  apartment?: string;
  location: {
    lat: number;
    lon: number;
  };
  formatted_address?: string;
}

export interface CreateUser {
  id?: string;
  phone: string;
  phone_verified: boolean;
  email?: string | null;
  email_verified?: boolean;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  current_address?: string;
  addresses?: Place[];
  current_store?: string | null;
}

export interface User extends CreateUser {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentProvider {
  credentials: MercadoPagoCredentials;
}

export interface CreateStore {
  user: string;
  name: string;
  phone: string;
  images: string[];
  enabled: boolean;
  reference: string;
  description?: string;
  delivery_time: IntegerRange;
  delivery_area: DeliveryArea;
  opening_hours: OpeningHours;
  payment_provider?: PaymentProvider;
}

export interface Store extends CreateStore {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProduct {
  name: string;
  price: number;
  tags?: string[];
  images: string[];
  enabled: boolean;
  reference: string;
  description?: string;
}

export interface Product extends CreateProduct {
  id: string;
  store: string;
  created_at: Date;
  updated_at: Date;
}

export interface Item extends Product {
  qty: number;
}

export interface StoreProduct extends Product {
  stats: {
    order_messages: number;
    product_messages: number;
  };
  store_info: {
    id: string;
    name: string;
    enabled: boolean;
    images: string[];
    address: Place;
    created_at: Date;
    delivery_area: Circle;
    delivery_time: IntegerRange;
    opening_hours: OpeningHours;
  };
}

export interface CreateOrder {
  idempotency: string;
  customer: {
    id: string;
    email?: string | null;
    first_name: string;
    last_name?: string | null;
    photo_url?: string | null;
    phone: string;
    created_at?: Date;
  };
  transaction: {
    country: string;
    currency: string;
    language: string;
    delivery_address: Place;
    shopping_cart: {
      store: Store;
      items: Item[];
    };
  };
}

export enum OrderStatus {
  CREATED = "created",
  CONFIRMED = "confirmed",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum CancellationExecuter {
  CLIENT = "client",
  SELLER = "seller",
  BEAST = "beast",
}

export enum CancellationReason {
  INACTIVITY = "inactivity",
}

export interface Order extends CreateOrder {
  id: string;
  status: OrderStatus;
  cancellation_information?: {
    executer: CancellationExecuter;
    reason?: CancellationReason;
  };
  stats: {
    amount: number;
    total: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface CreateDevice {
  id?: string;
  platform: string;
  platform_version: string;
  app_version: string | null;
  app_build_version: string | null;
  token: string | null;
  user_id: string | null;
  user_location: {
    lat: number;
    lon: number;
  } | null;
  user_current_store: string | null;
}

export interface Device extends CreateDevice {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationFilters {
  user: string;
}

export interface NotificationMessage extends Omit<ExpoPushMessage, "to"> {}

export interface CreateNotification {
  idempotency: string;
  filters: NotificationFilters;
  message: NotificationMessage;
}

export interface Notification extends CreateNotification {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMercadoPagoCheckout {
  customer: {
    email: string;
    first_name: string;
    last_name?: string;
    phone: string;
  };
  transaction: {
    currency: string;
    delivery_address: {
      street_number: AddressProp;
      route: AddressProp;
    };
    store: {
      name: string;
      payment_provider: PaymentProvider;
    };
    amount: number;
  };
}

export enum WidgetType {
  STORE_HORIZONTAL_LIST = "store_horizontal_list",
  STORE_VERTICAL_LIST = "store_vertical_list",
  PRODUCT_HORIZONTAL_LIST = "product_horizontal_list",
}

export interface CreateWidget {
  type: WidgetType;
  tags: string[];
  order: number;
  instructions: { [key: string]: any };
}

export interface Widget extends CreateWidget {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface StoreHorizontalListWidget extends Widget {
  type: WidgetType.STORE_HORIZONTAL_LIST;
  instructions: {
    title: string;
    search: SearchParams;
  };
}

export interface StoreVerticalListWidget extends Widget {
  type: WidgetType.STORE_VERTICAL_LIST;
  instructions: {
    search: SearchParams;
  };
}

export interface ProductHorizontalListWidget extends Widget {
  type: WidgetType.PRODUCT_HORIZONTAL_LIST;
  instructions: {
    title: string;
    search: SearchParams;
    min_allowed: number;
  };
}

export interface RenderedWidget {
  id: string;
  type: WidgetType;
  data: { [key: string]: any };
}

export interface StoreHorizontalListRenderedWidget extends RenderedWidget {
  data: {
    title: string;
    response: SearchResponse<StoreProduct>;
  };
}

export interface StoreVerticalListRenderedWidget extends RenderedWidget {
  data: {
    response: SearchResponse<StoreProduct>;
  };
}

export interface ProductHorizontalListRenderedWidget extends RenderedWidget {
  data: {
    title: string;
    response: SearchResponse<StoreProduct>;
  };
}
