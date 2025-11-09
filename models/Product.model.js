// models/Item.model.js
const { Schema, model } = require("mongoose");
const { v4: uuidv4 } = require("uuid"); // Import the uuid generator

// Define your fixed airport list as a constant
const AIRPORT_LIST = [
  "amritsar",
  "jalandhar",
  "ghaziabad",
  "jaisalmer",
  "ludhiana",
];

const ProductSchema = new Schema(
  {
    // --- NEW UUID FIELD ---
    uuid: {
      type: String,
      unique: true,
      default: uuidv4, // Automatically generates a new UUID on creation
    },
    // ----------------------

    // --- Core Fields ---
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
    },

    // --- Pricing Field (Your simple array) ---
    pricing: [
      {
        _id: false, // This keeps your objects simple
        airport: {
          type: String,
          required: true,
          enum: {
            values: AIRPORT_LIST,
            message: "{VALUE} is not a supported airport",
          },
        },
        price: {
          type: Number,
          required: [true, "Price for the airport is required"],
          min: [0, "Price cannot be negative"],
        },
      },
    ],
    // ----------------------------------------

    // --- Availability Fields ---
    availableAtAirports: {
      type: [String],
      required: true,
      enum: {
        values: AIRPORT_LIST,
        message: "{VALUE} is not a supported airport",
      },
      validate: [
        (val) => val.length > 0,
        "Item must be available at one airport",
      ],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },

    itemCode: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// --- Validation Hook (No changes needed) ---
ProductSchema.pre("save", function (next) {
  const availableAirports = this.availableAtAirports;
  const pricedAirports = this.pricing.map((p) => p.airport);

  // 1. Check for duplicates in the pricing array
  const uniquePricedAirports = new Set(pricedAirports);
  if (uniquePricedAirports.size !== pricedAirports.length) {
    return next(new Error("Duplicate airport entries found in pricing array."));
  }

  // 2. Check if every 'available' airport has a price
  for (const airport of availableAirports) {
    if (!pricedAirports.includes(airport)) {
      return next(new Error(`Price missing for available airport: ${airport}`));
    }
  }

  // 3. Check if every 'priced' airport is listed as 'available'
  for (const airport of pricedAirports) {
    if (!availableAirports.includes(airport)) {
      return next(
        new Error(
          `Price added for unavailable airport: ${airport}. Please add '${airport}' to 'availableAtAirports' first.`
        )
      );
    }
  }

  next();
});

const Product = model("Product", ProductSchema, "product");

module.exports = Product;
