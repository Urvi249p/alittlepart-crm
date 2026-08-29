import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc
} from 'firebase/firestore';
import { db } from './firebaseClient';

// Ensures the expense cutoff metadata document exists and returns its current data.
export const ensureExpenseCutoff = async (orders = []) => {
  const cutoffRef = doc(db, 'meta', 'expenseCutoff');
  const existingDoc = await getDoc(cutoffRef);

  if (!existingDoc.exists()) {
    const excludedOrderIds = (orders || [])
      .filter(order => order?.status === 'Completed')
      .map(order => order.id)
      .filter(Boolean);

    const newCutoff = {
      excludedOrderIds,
      initialized: true,
      createdAt: new Date().toISOString()
    };

    await setDoc(cutoffRef, newCutoff);
    return newCutoff;
  }

  return existingDoc.data();
};

// Subscribes to the expense cutoff metadata document and emits its latest data.
export const subscribeToExpenseCutoff = (callback) => {
  const cutoffRef = doc(db, 'meta', 'expenseCutoff');

  return onSnapshot(cutoffRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });
};

// Saves a single expense record to Firestore using the expense id as the document key.
export const saveExpenseToFirestore = async (expense) => {
  await setDoc(doc(db, 'expenses', expense.id), expense);
};

// Removes an expense document from Firestore by its id.
export const deleteExpenseFromFirestore = async (id) => {
  await deleteDoc(doc(db, 'expenses', id));
};

// Subscribes to the expenses collection in date-desc order and emits an array of expense objects.
export const subscribeToExpenses = (callback) => {
  const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));

  const mapExpenseDocs = (snapshot) => snapshot.docs.map(docSnapshot => ({
    ...docSnapshot.data(),
    id: docSnapshot.id
  }));

  void getDocs(expensesQuery)
    .then(snapshot => {
      callback(mapExpenseDocs(snapshot));
    })
    .catch(error => {
      console.error('Failed to load expenses from Firestore:', error);
    });

  return onSnapshot(expensesQuery, (snapshot) => {
    callback(mapExpenseDocs(snapshot));
  });
};
