import styled from "styled-components";

export const Submit = styled.button`
  background-image: linear-gradient(to right, #35c3c1 0%, #00d6b7 100%);
  color: white;
  border: 0;
  border-radius: 5px;
  text-transform: uppercase;
  width: 100%;
  padding: 0.5em;
  font-size: 1.2em;

  &:hover {
    outline: none;
    transition: transform 0.15s ease;
    transform: scale(1.05);
    cursor: pointer;
  }
`;
export const Content = styled.textarea`
  width: 100%;
  height: 50vh;
`;
export const Input = styled.input`
width: 100%;
padding: 1em;
border: 1px solid ${({ theme }) => theme.invertText}
border-radius: 5px;

&:focus {
  outline: none;
  border: 2px solid #35c3c1;
  border-radius: 5px;
}
`;
export const Label = styled.label`
  color: ${({ theme }) => theme.invertText};
  display: block;
  font-size: 0.6em;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 2%;
`;
export const FieldSet = styled.div`
  margin-bottom: 1em;
`;
export const Form = styled.form`
  background-color: ${({ theme }) => theme.invertBody};
  border-radius: 20px;
  padding: 2em;
  box-shadow: 0px 56px 72px -30px rgba(50, 55, 63, 0.66);

  @media (max-width: 768px) {
    width: 100%;
  }
`;
export const Container = styled.div`
  width: 50vw;
  h1 {
    text-align: center;
  }
`;
