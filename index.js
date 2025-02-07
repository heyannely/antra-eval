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
  const checkoutButton = document.querySelector(".cart__checkout");

  console.log("Inventory Container:", inventoryContainer);
  console.log("Checkout Button:", checkoutButton);

  const renderInventory = (inventory) => {
    inventoryContainer.innerHTML = inventory
      .map(
        (item) => `
        <div class="inventory__item" data-id="${item.id}">
          <span class="inventory__name">${item.content}</span>
          <button class="inventory__btn inventory__btn--decrease">-</button>
          <span class="inventory__quantity">${item.quantity}</span>
          <button class="inventory__btn inventory__btn--increase">+</button>
          <button class="inventory__btn inventory__btn--add">add to cart</button>
        </div>
      `
      )
      .join("");
  };

  return {
    renderInventory,
    inventoryContainer,
    checkoutButton, 
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleQuantityChange = () => {
    
  };

  const handleAddToCart = () => {};

  const handleEdit = () => {};

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

  const handleDelete = () => {};

  const handleCheckout = () => {
    view.checkoutButton.addEventListener("click", () => {
      model.checkout().then(() => {
        state.cart = [];
        alert("Checkout successful!");
      });
    });
  };

  const init = () => {
    console.log("Initializing Controller...");

    state.subscribe(() => {
        view.renderInventory(state.inventory); 
    });

    model.getInventory().then((inventory) => {
        console.log("Fetched inventory from API:", inventory);
        state.inventory = inventory; 
    });

    handleEditAmount();
    handleAddToCart();
    handleCheckout();
};

  return {
    init,
  };
})(Model, View);

Controller.init();
