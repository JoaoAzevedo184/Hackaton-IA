import { Navigate } from "react-router-dom";

/** Redireciona para o Dashboard — a página inicial agora é a listagem de jogos */
const Index = () => <Navigate to="/" replace />;

export default Index;