import { translateParamLabel } from "./I18n.js";

export class ParamPanel {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
  }

  render(schema, params) {
    this.container.replaceChildren();
    schema.forEach((field) => {
      const wrapper = document.createElement("div");
      wrapper.className = "param-control";
      const label = document.createElement("label");
      const name = document.createElement("span");
      name.textContent = translateParamLabel(field);
      const value = document.createElement("span");
      value.textContent = params[field.key];
      label.append(name, value);

      const input = document.createElement("input");
      input.type = field.type === "range" ? "range" : field.type === "color" ? "color" : "text";
      input.value = params[field.key];
      if (field.type === "range") {
        input.min = field.min;
        input.max = field.max;
        input.step = field.step;
      }

      input.addEventListener("input", () => {
        const nextValue = field.type === "range" ? Number(input.value) : input.value;
        value.textContent = nextValue;
        this.onChange(field.key, nextValue);
      });

      wrapper.append(label, input);
      this.container.append(wrapper);
    });
  }
}
