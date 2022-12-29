const express = require('express')
const crypto = require('node:crypto')

const app = express()

app.use(express.json())

//In Memory Storage
const customers = []

//Middleware
function verifyIfExistAccountCPF(req, res, next) {
  const { cpf } = req.headers

  if (customers.length === 0) {
    res.status(401).json({
      message: 'Account not found'
    })
  }

  const customer = customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    res.status(401).json({
      message: 'Account not found'
    })
  }

  req.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)

  return balance
}

/**
 * cpf: string
 * name: string
 * id: uuid
 * statement: [] (armazenara os extratos)
 */
app.post('/account', (req, res) => {
  const { cpf, name } = req.body
  const id = crypto.randomUUID()

  const customerAlredyExist = customers.some(customer => customer.cpf === cpf)

  if (customerAlredyExist) {
    return res.status(400).json({ error: 'Customer already exists' })
  }

  const customer = {
    id,
    name,
    cpf,
    statement: []
  }

  customers.push(customer)

  return res.status(201).json(customer)
})

//No comentário a abaixo é outra forma de se utilizar um middleware
//  nesse caso todas as rotas abaixo do middleware vai aciona-lo para executar suas responsabilidade

//app.use(verifyIfExistAccountCPF)

/**
 * Buscar Statement de cliente
 */
app.get('/statement', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req

  return res.json(customer.statement)
})

app.post('/deposit', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req
  const { description, amount } = req.body

  const statementOperation = {
    description: description,
    amount: amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})

app.post('/withdraw', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req
  const { amount } = req.body

  console.log('customer-withdraw : ' + customer)

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' })
  }

  const statementOperation = {
    amount: amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})

app.get('/statement/date', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req
  const date = req.query

  //atribuindo 00h para levar em conta somente o dia inteiro
  const dateFormat = new Date(date + '00:00')

  const statements = customer.statement.filter(statement => {
    statement.created_at.toDateString() === dateFormat.toDateString()
  })

  return res.json(customer.statement)
})

app.put('/account', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req
  const { name } = req.body

  customer.name = name

  return res.json(customer)
})

app.delete('/account', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req
  const { name } = req.body
  const { id } = customer

  customers.splice(customer, 1)

  return res.status(200).json(customers)
})

app.get('/balance', verifyIfExistAccountCPF, (req, res) => {
  const { customer } = req

  const balance = getBalance(customer.statement)

  return res.status(200).json({
    customer: {
      id: customer.id,
      name: customer.name
    },
    balance: balance
  })
})

app.listen(3333)
