import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../features/userSlice";
import { loadStripe } from "@stripe/stripe-js";
import {
  db,
  getDocs,
  where,
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
} from "../firebase";
import "./PlansScreen.css";

const PlansScreen = () => {
  const [products, setProducts] = useState([]);
  const user = useSelector(selectUser);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (user.uid) {
      const q = query(collection(db, "customers", user.uid, "subscriptions"));

      onSnapshot(q, (querySnapshot) => {
        querySnapshot.forEach(async (subscription) => {
          setSubscription({
            role: subscription?.data()?.role,
            current_period_start:
              subscription?.data()?.current_period_start?.seconds,
            current_period_end:
              subscription?.data()?.current_period_end?.seconds,
          });
        });
      });
    }
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, "products"), where("active", "==", true));
    const unsub = onSnapshot(q, async (querySnapshot) => {
      const products = {};
      for (const productDoc of querySnapshot.docs) {
        products[productDoc.id] = productDoc.data();
        const priceSnap = await getDocs(collection(productDoc.ref, "prices"));
        for (const price of priceSnap.docs) {
          products[productDoc.id].price = {
            priceId: price.id,
            priceData: price.data(),
          };
        }
      }
      setProducts(products);
    });
    return () => unsub();
  }, []);

  const loadCheckout = async (priceId) => {
    const checkoutSessionRef = await addDoc(
      collection(doc(db, "customers", user.uid), "checkout_sessions"),
      {
        cancel_url: window.location.origin,

        price: priceId,
        success_url: window.location.origin,
      }
    );

    onSnapshot(checkoutSessionRef, async (snap) => {
      const { error, sessionId } = snap.data();
      if (error) {
        alert(`An error occured: ${error.message}`);
      }

      if (sessionId) {
        const stripe = await loadStripe(
          "YOUR STRIPE TEST KEY"
        );
        stripe.redirectToCheckout({ sessionId });
      }
    });
  };

  return (
    <div className="plansScreen">
      {subscription && (
        <p className="plansScreen__date">
          Renewal date:{" "}
          {new Date(
            subscription?.current_period_end * 1000
          ).toLocaleDateString()}
        </p>
      )}
      {Object.entries(products).map(([productId, productData]) => {
        const isCurrentPackage = productData.name
          ?.toLowerCase()
          .includes(subscription?.role);

        return (
          <div
            className={`${
              isCurrentPackage && "plansScreen__plan--disable"
            } plansScreen__plan`}
            key={productId}
          >
            <div className="plansScreen__info">
              <h5>{productData.name}</h5>
              <h6>{productData.description}</h6>
            </div>

            <button
              onClick={() =>
                !isCurrentPackage && loadCheckout(productData?.price?.priceId)
              }
            >
              {isCurrentPackage ? "Current Package" : "Subscribe"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PlansScreen;
