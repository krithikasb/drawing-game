// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyBdQkLQPtVvcHpBU9UV6kd-FkG89504Px0",
  authDomain: "drawing-game1.firebaseapp.com",
  projectId: "drawing-game1",
  storageBucket: "drawing-game1.appspot.com",
  messagingSenderId: "203018065077",
  appId: "1:203018065077:web:40791aa9d99e81fd12dafc"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth().signInAnonymously()
.then(() => {
  // Signed in..
})
.catch((error) => {
  var errorCode = error.code;
  var errorMessage = error.message;
  // ...
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    var uid = user.uid;
    // ...
  } else {
    // User is signed out
    // ...
  }
});