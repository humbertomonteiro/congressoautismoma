import styles from "./formGetData.module.css";
import ButtonSecondary from "../ButtonSecondary";
import { IoMdClose } from "react-icons/io";
import { useState } from "react";

import { addDoc, collection } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";

import { createPortal } from "react-dom";
import toast from "react-hot-toast";

const FormGetData = ({ setFormGetData, link, group }) => {
  const [fullName, setFullName] = useState("");
  const [names, setNames] = useState(["", "", "", "", ""]);
  const [email, setEmail] = useState("");

  const handleChange = (index, value) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  // const addNameField = () => {
  //   setNames([...names, ""]);
  // };

  // const removeNameField = (index) => {
  //   if (names.length > 5) {
  //     setNames(names.filter((_, i) => i !== index));
  //   }
  // };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (group) {
      const validNames = names.filter((name) => name.trim() !== "");

      if (validNames.length === 0 || !email) {
        toast.error("Por favor, preencha pelo menos um nome e o email.");
        return;
      }

      if (validNames.length < 5) {
        toast.error("Por favor, informe pelo menos 5 nomes");
        return;
      }

      try {
        await addDoc(collection(db, "participantes-certificado"), {
          names: validNames,
          email,
        });
        window.location.href = link;
      } catch (error) {
        toast.error("Erro ao coletar dados, tente mais tarde.");
        console.log("Erro: " + error);
      }
    } else {
      if (!fullName || !email) {
        toast.error("Por favor, preencha todos os campos.");
        return;
      }

      try {
        await addDoc(collection(db, "participantes-certificado"), {
          fullName,
          email,
        });
        window.location.href = link;
      } catch (error) {
        toast.error("Erro ao coletar dados, tente mais tarde.");
        console.log("Erro: " + error);
      }
    }
  };

  return createPortal(
    <div className={styles.divForm}>
      <div className={styles.contentForm}>
        <h2>Preencha os campos para garantir seu Certificado.</h2>
        <p>
          Atenção! Ao participar do nosso congresso, você vai receber um
          certificado. Para que possamos criar seu sertificado, precisamos do
          seu <mark>nome completo</mark> e do seu e-mail principal.
        </p>
        <form className={styles.formGetData} onSubmit={handleSubmit}>
          <button
            className={styles.btnClose}
            onClick={() => setFormGetData(false)}
          >
            <IoMdClose />
          </button>
          {group ? (
            <div className={styles.inputs}>
              {names.map((name, index) => (
                <label key={index}>
                  <input
                    type="text"
                    required
                    placeholder={`Nome do participante ${index + 1}`}
                    onChange={(e) => handleChange(index, e.target.value)}
                    value={name}
                  />
                  {/* {names.length > 5 && (
                    <button
                      type="button"
                      onClick={() => removeNameField(index)}
                      className={styles.removeFiel}
                    >
                      ❌
                    </button>
                  )} */}
                </label>
              ))}
              {/* <button
                type="button"
                onClick={addNameField}
                className={styles.addName}
              >
                ➕ Adicionar Participante
              </button> */}
            </div>
          ) : (
            <label>
              <span>
                Informe seu nome completo para gerarmos seu certificado:
              </span>
              <input
                type="text"
                required
                placeholder="Digite seu nome completo..."
                onChange={(e) => setFullName(e.target.value)}
                value={fullName}
              />
            </label>
          )}
          <label>
            <span>
              Informe seu melhor email para enviarmos seu certificado:
            </span>
            <input
              type="email"
              required
              placeholder="Digite seu melhor e-mail..."
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </label>
          <ButtonSecondary type="submit" style={{ width: "100%" }}>
            Ir para o checkout
          </ButtonSecondary>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default FormGetData;
