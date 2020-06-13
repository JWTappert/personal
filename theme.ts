const shared = {
  colors: {
    primary: "#35c3c1",
    secondary: "",
    tertiary: "",
  },
};

export const lightTheme = {
  ...shared,
  body: "#E2E2E2",
  invertBody: "#363537",
  text: "#363537",
  invertText: "#FAFAFA",
  toggleBorder: "#FFF",
  gradient: "linear-gradient(#39598A, #79D7ED)",
  inputFill: "#fff",
};

export const darkTheme = {
  ...shared,
  body: "#363537",
  invertBody: "#FFF",
  text: "#FAFAFA",
  invertText: "#363537",
  toggleBorder: "#6B8096",
  gradient: "linear-gradient(#091236, #1E215D)",
  inputFill: "#ccc",
};
