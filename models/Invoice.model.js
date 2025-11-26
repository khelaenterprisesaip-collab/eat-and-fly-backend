const { Schema, model } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Define your fixed airport list as a constant
const AIRPORT_LIST = [
  "amritsar",
  "jalandhar",
  "ghaziabad",
  "jaisalmer",
  "ludhiana",
];

const InvoiceSchema = new Schema(
  {
    uuid: {
      type: String,
      required: false,
      unique: true,
      default: uuidv4,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    airport: {
      type: String,
      enum: AIRPORT_LIST,
    },
    //store unix here
    dateTime: {
      type: Number,
      required: true,
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
      phoneNumber: {
        type: Number,
      },
    },
    subTotal: {
      type: Number,
      required: true,
    },
    taxPercentage: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["paid", "unpaid", "overdue"],
    },
    items: [
      {
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        perUnitPrice: { type: Number, default: 0 },
        totalPrice: { type: Number, default: 0 },
      },
    ],
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "card", "online"],
    },
    comment: {
      type: String,
      required: false,
    },
    pdf: {
      name: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = model("Invoice", InvoiceSchema, "invoice");
