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

var uid;
var displayName;
var isAdmin = false;
var score = 0;
var userRef;
// firebase.auth().onAuthStateChanged((user) => {
//   if (user) {
//     // User is signed in, see docs for a list of available properties
//     // https://firebase.google.com/docs/reference/js/firebase.User
//     uid = user.uid;
//     user.updateProfile({
//       displayName: userName,
//     }).then(function () {
//       var displayName = user.displayName;
//       console.log("fb", uid, displayName);
//       firebase.database().ref(`/images/${gameId}/users/`).set({
//         [displayName]: uid
//       });
//     });
//     // ...
//   } else {
//     // User is signed out
//     // ...
//   }
// });

 function firebaseSignIn() {
  firebase.auth().signInAnonymously()
    .then((response) => {
      // Signed in..
      console.log("fb signin", response.user);
      var user = response.user;
      uid = user.uid;
      user.updateProfile({
        displayName: userName,
      }).then(function () {
        displayName = user.displayName;
        console.log("fb", uid, displayName);

        var userListRef = firebase.database().ref(`/images/${gameId}/users/`);
        userRef = userListRef.push();
        userRef.set({
          uid: uid,
          displayName: displayName,
          score: score
        });
      });
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    });
}
