import { http, HttpResponse } from "msw";

const defaultUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "USER" as const,
};

export const handlers = [
  // ---- Auth ---- //

  http.post("/auth/register", async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body.username || !body.email || !body.password) {
      return HttpResponse.json({ errors: ["missing fields"] }, { status: 422 });
    }
    if (body.email === "existing@test.com") {
      return HttpResponse.json(
        { message: "Email already in use", error: "email_in_use" },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      { id: 2, username: body.username, email: body.email },
      { status: 201 },
    );
  }),

  http.post("/auth/login", async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body.email || !body.password) {
      return HttpResponse.json({ errors: ["missing fields"] }, { status: 422 });
    }
    if (body.email !== defaultUser.email) {
      return HttpResponse.json(
        { message: "Invalid credentials", error: "email_missing" },
        { status: 401 },
      );
    }
    if (body.password !== "password123") {
      return HttpResponse.json(
        { message: "Invalid credentials", error: "wrong_password" },
        { status: 401 },
      );
    }
    return HttpResponse.json(
      {
        accessToken: "mock-access-token",
        user: defaultUser,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": "auth_refresh_token=mock-refresh-token; Path=/auth/",
        },
      },
    );
  }),

  http.get("/auth/logout", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/auth/refresh", ({ cookies }) => {
    if (!cookies.auth_refresh_token) {
      return HttpResponse.json(
        { message: "Missing token", error: "missing_token" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ accessToken: "new-mock-access-token" });
  }),

  http.get("/auth/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    return HttpResponse.json(defaultUser);
  }),

  http.get("/auth/users/:id", ({ params }) => {
    const id = Number(params.id);
    if (isNaN(id)) {
      return HttpResponse.json(
        { message: "Invalid ID", error: "invalid_id" },
        { status: 404 },
      );
    }
    return HttpResponse.json({ ...defaultUser, id });
  }),

  http.post("/auth/change-role", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    const body = (await request.json()) as any;
    if (
      typeof body.id !== "number" ||
      !["USER", "ADMIN", "OWNER"].includes(body.newRole)
    ) {
      return HttpResponse.json({ errors: ["invalid fields"] }, { status: 422 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Products ---- //

  http.post("/product", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    const body = (await request.json()) as any;
    if (!body.productName || !body.price) {
      return HttpResponse.json(
        { errors: ["missing required fields"] },
        { status: 422 },
      );
    }
    return HttpResponse.json(
      { id: "507f1f77bcf86cd799439011" },
      { status: 201 },
    );
  }),

  http.get("/product/user/:id", () => {
    return HttpResponse.json({ products: [] });
  }),

  http.get("/product/:id", ({ params }) => {
    const { id } = params;
    if (id === "nonexistent") {
      return HttpResponse.json(
        { message: "Product Not Found" },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      id,
      name: "Mock Product",
      price: 29.99,
      description: "A mock product for testing",
      imageFilename: "mock.png",
      owner: 1,
      details: { color: "red" },
      uploadedAt: Date.now(),
    });
  }),

  http.get("/product", ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const products = [
      {
        id: "1",
        name: "Red Chair",
        price: 49.99,
        description: "",
        imageFilename: "",
        owner: 1,
        details: {},
        uploadedAt: Date.now(),
      },
      {
        id: "2",
        name: "Blue Table",
        price: 89.99,
        description: "",
        imageFilename: "",
        owner: 1,
        details: {},
        uploadedAt: Date.now(),
      },
    ];
    const filtered = search
      ? products.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()),
        )
      : products;
    return HttpResponse.json({ products: filtered });
  }),

  http.patch("/product/:id", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete("/product/:id", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Reviews ---- //

  http.post("/review", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    const body = (await request.json()) as any;
    if (!body.productId || !body.rating || !body.comment) {
      return HttpResponse.json({ errors: ["missing fields"] }, { status: 422 });
    }
    if (body.rating < 1 || body.rating > 5) {
      return HttpResponse.json({ errors: ["invalid rating"] }, { status: 422 });
    }
    return HttpResponse.json(
      { id: "607f1f77bcf86cd799439011" },
      { status: 201 },
    );
  }),

  http.get("/review/product/:productId", () => {
    return HttpResponse.json({
      reviews: [
        {
          productId: "1",
          userId: 1,
          username: "testuser",
          rating: 5,
          comment: "Great!",
          createdAt: 2000,
        },
        {
          productId: "1",
          userId: 2,
          username: "otheruser",
          rating: 3,
          comment: "Okay",
          createdAt: 1000,
        },
      ],
    });
  }),

  // ---- Cart ---- //

  http.get("/cart", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ userId: 1, products: [] });
  }),

  http.post("/cart/items", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    const body = (await request.json()) as any;
    if (!body.productId) {
      return HttpResponse.json(
        { errors: ['["productId"]: must be a string'] },
        { status: 422 },
      );
    }
    return HttpResponse.json({
      userId: 1,
      products: [
        { productId: body.productId, quantity: 1, addedAt: Date.now() },
      ],
    });
  }),

  http.delete("/cart/items", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    const body = (await request.json()) as any;
    if (!body.productId) {
      return HttpResponse.json(
        { errors: ['["productId"]: must be a string'] },
        { status: 422 },
      );
    }
    return HttpResponse.json({ userId: 1, products: [] });
  }),

  http.delete("/cart", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Image ---- //

  http.post("/image", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    return HttpResponse.json(
      {
        message: "Successfully created",
        path: "http://localhost:3000/image/by-name/mock.png",
        filename: "mock.png",
      },
      { status: 201 },
    );
  }),

  http.delete("/image/by-name/:image", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ message: "Successfully deleted" });
  }),
];
