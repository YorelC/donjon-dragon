import { ButtonBaseProps, applyStyles } from "./buttonsUtils";

export function Button({
  labelAndStylesButtonBase,
  ...props
}: ButtonBaseProps) {
  const buttonStyles = applyStyles(
    labelAndStylesButtonBase.color,
    labelAndStylesButtonBase.size
  );

  return (
    <button className={buttonStyles} {...props}>
      {labelAndStylesButtonBase.label}
    </button>
  );
}

export default Button;
