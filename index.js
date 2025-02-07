const API = (() => {
  const URL = "http://localhost:3000";

  const getCart = () => {
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: newAmount }),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
    }).then((res) => res.json());
  };

  const updateInventory = (id, newQuantity) => {
    return fetch(`${URL}/inventory/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: newQuantity }),
    }).then((res) => res.json());
  };

  const checkout = () => {
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    getInventory,
    addToCart,
    updateCart,
    deleteFromCart,
    updateInventory,
    checkout,
  };
})();

const Model = (() => {
  class State {
    #onChange;
    #inventory;
    #cart;

    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }

    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }

    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  return {
    State,
    ...API,
  };
})();

const View = (() => {
  const inventoryContainer = document.querySelector(".inventory");
  const cartContainer = document.querySelector(".cart__list");
  const checkoutButton = document.querySelector(".cart__checkout");

  console.log("Inventory Container:", inventoryContainer);
  console.log("Checkout Button:", checkoutButton);

  const renderInventory = (inventory) => {
    inventoryContainer.innerHTML = `
        <h2 class="inventory__title">Inventory</h2>
        ${inventory
          .map(
            (item) => `
            <div class="inventory__item" data-id="${item.id}">
              <span class="inventory__name">${item.content}</span>
              <button class="inventory__btn inventory__btn--decrease">-</button>
              <span class="inventory__quantity">${item.quantity}</span>
              <button class="inventory__btn inventory__btn--increase">+</button>
              <button class="inventory__btn inventory__btn--add">Add to Cart</button>
            </div>
          `
          )
          .join("")}
    `;

    console.log("Rendered Inventory:", inventory);
  };

  const renderCart = (cart) => {
    cartContainer.innerHTML = cart
      .map(
        (item) => `
          <li class="cart__item" data-id="${item.id}">
            <span class="cart__name">${item.content} x ${item.quantity}</span>
            <button class="cart__btn cart__btn--edit">Edit</button>
            <button class="cart__btn cart__btn--delete">Delete</button>
          </li>
        `
      )
      .join("");

    console.log("Rendered Cart:", cart);
  };

  return {
    renderInventory,
    renderCart,
    inventoryContainer,
    cartContainer,
    checkoutButton, 
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleAddToCart = () => {
    view.inventoryContainer.addEventListener("click", (event) => {
      const target = event.target;
      const parentEl = target.closest(".inventory__item");
      if (!parentEl) return;
  
      if (!target.classList.contains("inventory__btn--add")) return;
  
      const id = Number(parentEl.dataset.id);
      let item = state.inventory.find((inv) => Number(inv.id) === id);
  
      if (!item || item.quantity === 0) {
        console.log("Cannot add item with zero quantity to cart.");
        return;
      }
  
      const cartItem = {
        id: item.id,
        content: item.content,
        quantity: item.quantity,
      };
  

      model.addToCart(cartItem)
        .then(() => {
          console.log(`Added ${item.content} x${item.quantity} to cart.`);
          return model.getCart();
        })
        .then((updatedCart) => {
          state.cart = updatedCart; 
          console.log("Updated Cart:", updatedCart);
        })
        .catch((error) => {
          console.error(`Error adding to cart:`, error);
        });
  
      item.quantity = 0;
      model.updateInventory(id, 0)
        .then(() => model.getInventory())
        .then((updatedInventory) => {
          state.inventory = updatedInventory; 
        });
    });
  };

  const handleEdit = () => {
    view.cartContainer.addEventListener("click", (event) => {
      const target = event.target;
      const parentEl = target.closest(".cart__item");
      if (!parentEl) return;
  
      if (!target.classList.contains("cart__btn--edit")) return;
  
      const id = Number(parentEl.dataset.id);
      
      if (!state.cart || state.cart.length === 0) {
        console.error("ERROR: Cart is empty or not updated yet.");
        return;
      }
  
      let item = state.cart.find((cartItem) => Number(cartItem.id) === id);
  
      if (!item) {
        console.error("ERROR: Item not found in state.cart:", id);
        console.log("Current state.cart:", state.cart);
        return;
      }
  
      console.log(`✏️ Editing item: ${item.content}, current quantity: ${item.quantity}`);
  
      //  new list item 
      const editItem = document.createElement("li");
      editItem.classList.add("cart__item");
      editItem.dataset.id = item.id;
      editItem.innerHTML = `
        <span class="cart__name">${item.content}</span>
        <button class="cart__btn cart__btn--decrease">-</button>
        <span class="cart__quantity">${item.quantity}</span>
        <button class="cart__btn cart__btn--increase">+</button>
        <button class="cart__btn cart__btn--save">Save</button>
      `;
  
      // Replace cart item
      parentEl.replaceWith(editItem);
  
      // Edit mode quanity
      editItem.querySelector(".cart__btn--increase").addEventListener("click", () => {
        item.quantity += 1;
        editItem.querySelector(".cart__quantity").textContent = item.quantity;
        console.log(`Increased quantity ${item.quantity}`);
      });
  
      editItem.querySelector(".cart__btn--decrease").addEventListener("click", () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
          editItem.querySelector(".cart__quantity").textContent = item.quantity;
          console.log(`Decreased quantity ${item.quantity}`);
        }
      });
  
      // Save functionality
      editItem.querySelector(".cart__btn--save").addEventListener("click", () => {
        console.log(`Saved quantity: ${item.quantity}`);
  
        model.updateCart(id, item.quantity)
          .then(() => model.getCart())
          .then((updatedCart) => {
            state.cart = updatedCart; 
          })
          .catch((error) => {
            console.error(`Error updating cart quantity:`, error);
          });
      });
    });
  };

  const handleEditAmount = () => {
    console.log("handleEditAmount function initialized!"); 

    view.inventoryContainer.addEventListener("click", (event) => {
        console.log("Click detected in inventory container"); 

        const target = event.target;
        const parentEl = target.closest(".inventory__item");
        if (!parentEl) {
            console.log("No valid inventory item found.");
            return;
        }

        if (!parentEl.dataset.id || isNaN(Number(parentEl.dataset.id))) {
            console.error("ERROR: Invalid or missing `data-id` attribute in HTML.");
            return;
        }

        const id = Number(parentEl.dataset.id);
        let item = state.inventory.find((inv) => Number(inv.id) === id);

        if (!item) {
            console.error("ERROR: Item not found in state.inventory:", id);
            console.log("Current state.inventory:", state.inventory);
            return;
        }

        console.log(`Clicked ${item.content}, current quantity: ${item.quantity}`);

        let newQuantity = item.quantity;

        if (target.classList.contains("inventory__btn--increase")) {
            newQuantity += 1;
            console.log(`Increasing ${item.content} quantity to ${newQuantity}`);
        } else if (target.classList.contains("inventory__btn--decrease") && newQuantity > 0) {
            newQuantity -= 1;
            console.log(`Decreasing ${item.content} quantity to ${newQuantity}`);
        }

        model.updateInventory(id, newQuantity)
            .then(() => {
                console.log(`Successfully updated ${item.content} to quantity ${newQuantity}`);
                return model.getInventory();
            })
            .then((updatedInventory) => {
                console.log("Updated inventory from API:", updatedInventory);
                state.inventory = updatedInventory;
            })
            .catch((error) => {
                console.error(`Error updating inventory for ${item.content}:`, error);
            });
    });
};

const handleDelete = () => {
  view.cartContainer.addEventListener("click", (event) => {
    const target = event.target;
    const parentEl = target.closest(".cart__item");
    if (!parentEl) return;

    if (!target.classList.contains("cart__btn--delete")) return;

    const id = Number(parentEl.dataset.id);

    console.log(`Deleting item`);

    model.deleteFromCart(id)
      .then(() => {
        console.log(`Deleted ${id} from cart`);
        return model.getCart();
      })
      .then((updatedCart) => {
        state.cart = updatedCart;
        console.log("Updated Cart after deletion:", updatedCart);
      })
      .catch((error) => {
        console.error(`Error deleting item from cart:`, error);
      });
  });
};

  const handleCheckout = () => {
    view.checkoutButton.addEventListener("click", () => {
      model.checkout().then(() => {
        state.cart = [];
        alert("Checkout successful!");
      });
    });
  };

  const init = () => {

    state.subscribe(() => {
        view.renderInventory(state.inventory);
        view.renderCart(state.cart);
    });

    Promise.all([model.getInventory(), model.getCart()])
      .then(([inventory, cart]) => {
        state.inventory = inventory;
        state.cart = cart;
      });

    handleEdit();
    handleEditAmount();
    handleAddToCart();
    handleDelete();
    handleCheckout();
};

  return {
    init,
  };
})(Model, View);

Controller.init();
