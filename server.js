const express = require("express");
const cors = require("cors");
const db = require("./firebase-config");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/doar", async (req, res) => {
  try {
    const dados = req.body;
    await db.collection("doacoes").add(dados);
    res.status(200).send("Doação registrada com sucesso!");
  } catch (error) {
    res.status(500).send("Erro ao registrar doação.");
  }
});

// Página ver-doacoes.html
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
app.get('/doacoes', async (req, res) => {
  try {
    const snapshot = await db.collection('doacoes').orderBy('timestamp', 'desc').get();
    const doacoes = snapshot.docs.map(doc => doc.data());
    res.json(doacoes);
  } catch (error) {
    res.status(500).send('Erro ao buscar doações: ' + error.message);
  }
});
app.use(express.static('public')); // serve arquivos HTML da pasta "public"
app.post("/doacao", async (req, res) => {
  const { nome, email, tipoDoacao } = req.body;

  const pontosRecebidos = 10; // Você pode mudar isso conforme o tipo da doação

  const userRef = db.collection("usuarios").doc(email);

// Parte de pontuações 
  await db.runTransaction(async (t) => {
    const doc = await t.get(userRef);
    if (!doc.exists) {
      // Se for novo usuário
      t.set(userRef, {
        nome,
        email,
        pontos: pontosRecebidos,
        nivel: "Bronze",
        beneficios: [],
      });
    } else {
      const dados = doc.data();
      const novosPontos = dados.pontos + pontosRecebidos;

      let nivel = "Bronze";
      let beneficios = [];

      if (novosPontos >= 100) {
        nivel = "Ouro";
        beneficios = ["Certificado digital", "Destaque no ranking"];
      } else if (novosPontos >= 50) {
        nivel = "Prata";
        beneficios = ["Certificado digital"];
      }

      t.update(userRef, {
        pontos: novosPontos,
        nivel,
        beneficios,
      });
    }
  });

  res.status(200).json({ mensagem: "Doação registrada com sucesso!" });
});
app.get("/usuario", async (req, res) => {
  const email = req.query.email;
  const userRef = db.collection("usuarios").doc(email);
  const doc = await userRef.get();

  if (!doc.exists) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  res.json(doc.data());
});
