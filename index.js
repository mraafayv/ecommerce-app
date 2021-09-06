if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}


const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const initializePassport = require('./passport-config');
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require('method-override');
const {
  get
} = require('http');


let users = [];
let itemsId = [];
let customerId;




// app.use(express.urlencoded({}));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))

// Login
app.get('/login', checkNotAuthenticated, function (req, res) {
  res.render('login');

})

// app.get('/login', function (req, res) {
//   res.render('login');

// })

// ,  function (req, res){
//   getUsers(req,res);
// },
app.post('/check', checkNotAuthenticated, passport.authenticate('local', {

  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true

}))

// SignUp
app.get('/signup', checkNotAuthenticated, function (req, res) {
  res.render('signup');

})

app.post('/login', checkNotAuthenticated, function (req, res) {
  getUsers(req, res);

})

// SignUp form
app.post('/signup', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hashSync(req.body.password, 10)
    var sql = "INSERT INTO customers (first_name, last_name, gender, city, email, password, contact_number, address) VALUES ?";
    var values = [
      [req.body.firstname, req.body.lastname, req.body.gender, req.body.city, req.body.email, hashedPassword, req.body.number, req.body.address]
    ];
    // res.json(req.body);
    db.query(sql, [values], function (err, result) {
      if (err) throw err;

    });
    res.redirect('login')

  } catch {
    res.redirect('signup')
  }

})

// To check if user is logged in
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('login')
}

// To check if user is not authenticated
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('home')
  }
  next()
}

// app.post('/getUsers', (req, res) => {
//   getUsers(req, res);
// })

function getUsers(req, param) {

  var sql = "SELECT * FROM customers c where c.email = ?"
  db.query(sql, [req.body.email], (err, results) => {
    if (err) throw err
    users.push({
      id: results[0]["customer_id"],
      email: results[0]["email"],
      password: results[0]["password"]
    });
    customerId = results[0]["customer_id"];
    console.log(users[0])
    // return users
    param.redirect(307, "/check");
    // res.send('users data fetched...')
  })

  // params.render("login");


}

initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);



//logout method
app.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
})



app.get('/home', checkAuthenticated, (req, param) => {

  db.query("SELECT * FROM products; SELECT COUNT(product_id) as productCount from products;", function (err, res) {
    if (err) throw err;
    var products = JSON.parse(JSON.stringify(res[0]));
    // var productsCount = JSON.parse(JSON.stringify(res[1]));
    // console.log(products);
    // render page and send data in array

    param.render('home', {
      "rows": products,
      // "productCount": productsCount,
      "itemsId": JSON.parse(JSON.stringify(itemsId))
      // "itemsId": itemsId

    });



    // res.render('home', {
    //   "rows": products,
    //   "itemsId": JSON.parse(JSON.stringify(itemsId))
    // })
  })
})


app.get('/shop', checkAuthenticated, (req, res) => {
  // res.render('shop')
  getProducts(res);
})

app.get('/checkout', checkAuthenticated, (req, res) => {
  res.render('checkout', {
    "itemsId": JSON.parse(JSON.stringify(itemsId))
  })
})


app.get('/products', checkAuthenticated, (req, res) => {
  getProducts(res);

})

app.post("/postOrder", checkAuthenticated, (req, res) => {
  var sql = "INSERT INTO orders (customer_id, order_date, amount, name, address, post_code, city, province, email, contactNumber) VALUES ?"
  var values = [
    req.body.customerId, req.body.today, req.body.amount, req.body.name, req.body.address, req.body.postcode, req.body.city, req.body.province, req.body.email, req.body.contact
  ]
  db.query(sql, [values], function (err, result) {
    if (err) throw err;

  });
  res.redirect('/orderPlaced')
})

app.get('/addItem', checkAuthenticated, (req, res) => {
  // res.render('shop')
  itemsId.push([req.query.id])
  console.log(itemsId);

  res.send(JSON.parse(JSON.stringify(itemsId)));
  // getProducts(res);
})

app.get('/removeItem', checkAuthenticated, (req, res) => {
  // res.render('shop')
  // let rmv = itemsId.indexOf(req.query.id);
  //   // console.log(rmv);
  //   itemsId.splice(rmv, 1);
  itemsId = req.query.id.split(",");
  console.log(req.query.id.split(","));
  res.send(JSON.parse(JSON.stringify(itemsId)));

  // getProducts(res);
})

app.get('/getProductById', checkAuthenticated, (req, res) => {

  getProductById(req, res);
})


//DataBase Connection
const db = mysql.createConnection({
  host: '127.0.0.10',
  user: 'root',
  password: 'root',
  database: 'ecomm_db',
  multipleStatements: true
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("DB Connected Successfully");
});



function postOrder(req, param) {
  const data = req.body;
  db.query("INSERT INTO (name, address,)", function (err, res) {
    if (err) throw err;
    // var products = JSON.parse(JSON.stringify(res[0]));
    // var productsCount = JSON.parse(JSON.stringify( res[1]));

    // console.log(data);
    // render page and send data in array
    // param.redirect('/checkout');

  })
}

function getProducts(param) {
  db.query("SELECT * FROM products; SELECT COUNT(product_id) as productCount from products;", function (err, res) {
    if (err) throw err;
    var products = JSON.parse(JSON.stringify(res[0]));
    var productsCount = JSON.parse(JSON.stringify(res[1]));
    // console.log(products);
    // render page and send data in array
    param.render('shop', {
      "rows": products,
      "productCount": productsCount,
      "itemsId": JSON.parse(JSON.stringify(itemsId))
      // "itemsId": itemsId

    });

  })
}



function getProductById(req, param) {
  db.query("SELECT * FROM products WHERE product_id = ?", [req.query.id], function (err, res) {
    if (err) throw err;
    // var products = JSON.parse(JSON.stringify(res[0]));
    var products = JSON.parse(JSON.stringify(res));
    // console.log(products);

    // render page and send data in array
    param.send(products);

  })
}



app.listen(3000, () => {
  console.log("listening on port 3000");
})



// const productCount = db.query("SELECT COUNT(product_id) from products", function(err, res){
// if(err) throw err
// return
//  })
// db.query("SELECT * FROM products", function(err, result) {
//   if (err) throw err;
//  const data = JSON.stringify(result);
//  console.log(data);
//  result (data);
// });




//get date method
let today = new Date().toLocaleDateString()

console.log(today)