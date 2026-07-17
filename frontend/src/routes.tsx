import { Route, Switch } from "wouter";
import { Root } from "./routes/+page";
import { LoginPage } from "./routes/auth/login/+page";
import { SignupPage } from "./routes/auth/signup/+page";
import { DefaultLayout } from "./layouts/DefaultLayout";
import { MePage } from "./routes/auth/me/+page";
import { AuthenticatedLayout } from "./layouts/AuthenticatedLayout";
import { UserPage } from "./routes/auth/user/+page";
import { CreateProductPage } from "./routes/product/create/+page";
import { ProductPage } from "./routes/product/[id]/+page";
import { CartPage } from "./routes/cart/+page";

function App() {
  return (
    <Switch>
      <Route path="/">
        <DefaultLayout>
          <Root />
        </DefaultLayout>
      </Route>
      <Route path="/auth/login">
        <DefaultLayout>
          <LoginPage />
        </DefaultLayout>
      </Route>
      <Route path="/auth/signup">
        <DefaultLayout>
          <SignupPage />
        </DefaultLayout>
      </Route>
      <Route path="/auth/me">
        <AuthenticatedLayout>
          <MePage />
        </AuthenticatedLayout>
      </Route>
      <Route path="/user/:id">
        <DefaultLayout>
          <UserPage />
        </DefaultLayout>
      </Route>
      <Route path="/product/create">
        <AuthenticatedLayout>
          <CreateProductPage />
        </AuthenticatedLayout>
      </Route>
      <Route path="/product/:id">
        <DefaultLayout>
          <ProductPage />
        </DefaultLayout>
      </Route>
      <Route path="/cart">
        <AuthenticatedLayout>
          <CartPage />
        </AuthenticatedLayout>
      </Route>

      <Route path="/404">
        <DefaultLayout>Page not found.</DefaultLayout>
      </Route>
      <Route>
        <DefaultLayout>Page not found.</DefaultLayout>
      </Route>
    </Switch>
  );
}

export default App;
