const USERS = "users";
const GAME_STATE = "gameState";
const CURRENTLY_DRAWING_USER = "currentlyDrawingUser";
const DRAWING = "drawing";
const WORD = "word";
const GUESSED_USERS = "guessedUsers";

function pathMapping(instance) {
  switch(instance) {
    case USERS:
      return `${gameId}/users`;
    case GAME_STATE: 
      return `${gameId}/gameState/`;
    case CURRENTLY_DRAWING_USER: 
      return `${gameId}/currentRound/currentlyDrawingUser`;
    case DRAWING: 
      return `${gameId}/${currentlyDrawingUser.uid}`;
    case WORD: 
      return `${gameId}/currentRound/word`;
    case GUESSED_USERS: 
      return `${gameId}/currentRound/guessedUsers`;
  }
}

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
//       firebase.database().ref(`${gameId}/users/`).set({
//         [displayName]: uid
//       });
//     });
//     // ...
//   } else {
//     // User is signed out
//     // ...
//   }
// });

function signInToFirebase() {
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

        var userListRef = firebase.database().ref(`${gameId}/users/`);
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

function setAdminInFirebase(user) {
  firebase.database().ref(`${gameId}/admin`).set(user);
}

function setGameStateInFirebase(gameState) {
  firebase.database().ref(`${gameId}/gameState/`).set(gameState);
}

function setCurrentlyDrawingUserInFirebase(user) {
  firebase.database().ref(`${gameId}/currentRound/currentlyDrawingUser/`).set(user);
}

function setWordInFirebase(word) {
  firebase.database().ref(`${gameId}/currentRound/word/`).set(word);
}

function setDrawingDataInFirebase(drawingData) {
  firebase.database().ref(`${gameId}/${uid}`).set(drawingData);
}

function pushGuessedUserInFirebase(user) {
  firebase.database().ref(`${gameId}/currentRound/guessedUsers`).push(user);
}

function updateCurrentUserScoreInFirebase(newScore) {
  score = newScore;
  userRef.set({
    uid: uid,
    displayName: displayName,
    score: score
  });
}

function resetGuessedUsersInFirebase() {
  firebase.database().ref(`${gameId}/currentRound/guessedUsers/`).set(null);
}

function deleteGameInFirebase() {
  firebase.database().ref(`${gameId}`).set(null);
}

function listenToFirebaseValueChange(instance, callback) {
  var listener = firebase.database().ref(pathMapping(instance));
  listener.on('value', (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
}

function listenToFirebaseChildAdded(instance, callback) {
  var listener = firebase.database().ref(pathMapping(instance));
  listener.on('child_added', (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
}