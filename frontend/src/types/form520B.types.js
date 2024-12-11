// src/types/form520B.types.js
export const DeliveryAcceptanceItems = {
    MATERIAL_PLACED: "Material placed in storage as documented above",
    DISCREPANCIES: "Discrepancies and/or damaged documented on the shipping paperwork",
    SUPPORTING_DOCS: "Supporting documentation received attached",
    SHIPMENT_REJECTED: "Shipment REJECTED. Reason documented on the shipping paperwork"
  };
  
  export const DocumentVerificationItems = {
    PURCHASE_ORDER: "Purchase Order",
    PACKING_SLIP: "Packing Slip",
    BILL_OF_LADING: "Bill of Lading",
    COC_COA: "CoC/CoA",
    SDS: "SDS #",
    INVOICE: "Invoice",
    OTHER: "Other (Specify)"
  };
  
  export const IssuesItems = {
    QUANTITY: "Quantity discrepancies found",
    SHIPPING_DAMAGE: "Damage to shipping container(s)",
    PRODUCT_DAMAGE: "Damage to product within shipping container",
    TEMPERATURE: "Temperature excursion"
  };
  
  export const DateTypes = {
    EXPIRATION: "Expiration Date",
    RETEST: "Retest Date",
    USE_BY: "Use-by-Date"
  };