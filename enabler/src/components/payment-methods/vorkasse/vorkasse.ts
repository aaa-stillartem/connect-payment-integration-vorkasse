import {
    ComponentOptions,
    PaymentComponent,
    PaymentComponentBuilder,
    PaymentMethod
} from '../../../payment-enabler/payment-enabler';
import { BaseComponent } from "../../base";
import styles from '../../../style/style.module.scss';
import buttonStyles from "../../../style/button.module.scss";
import {
    PaymentOutcome,
    PaymentRequestSchemaDTO,
} from "../../../dtos/mock-payment.dto";
import { BaseOptions } from "../../../payment-enabler/payment-enabler-mock";

export class VorkasseBuilder implements PaymentComponentBuilder {
    public componentHasSubmit = true;
    constructor(private baseOptions: BaseOptions) {}

    build(config: ComponentOptions): PaymentComponent {
        return new Vorkasse(this.baseOptions, config);
    }
}

export class Vorkasse extends BaseComponent {
    private showPayButton: boolean;

    constructor(baseOptions: BaseOptions, componentOptions: ComponentOptions) {
        super(PaymentMethod.vorkasse, baseOptions, componentOptions);
        this.showPayButton = componentOptions?.showPayButton ?? false;
    }

    mount(selector: string) {
        document
            .querySelector(selector)
            .insertAdjacentHTML("afterbegin", this._getTemplate());

        if (this.showPayButton) {
            document
                .querySelector("#invoiceForm-paymentButton")
                .addEventListener("click", (e) => {
                    e.preventDefault();
                    this.submit();
                });
        }
    }

    async submit() {
        // here we would call the SDK to submit the payment
        this.sdk.init({ environment: this.environment });
        try {
            const requestData: PaymentRequestSchemaDTO = {
                paymentMethod: {
                    type: this.paymentMethod,
                },
                paymentOutcome: PaymentOutcome.AUTHORIZED,
            };
            const response = await fetch(this.processorUrl + "/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Session-Id": this.sessionId,
                },
                body: JSON.stringify(requestData),
            });
            const data = await response.json();
            if (data.paymentReference) {
                this.onComplete &&
                this.onComplete({
                    isSuccess: true,
                    paymentReference: data.paymentReference,
                });
            } else {
                this.onError("Some error occurred. Please try again.");
            }
        } catch (e) {
            this.onError("Some error occurred. Please try again.");
        }
    }

    private _getTemplate() {
        return this.showPayButton
            ? `
    <div class="${styles.wrapper}">
      <p>Pay With Vorkasse and bla bla bla</p>
      <button class="${buttonStyles.button} ${buttonStyles.fullWidth} ${styles.submitButton}" id="invoiceForm-paymentButton">Pay</button>
    </div>
    `
            : "";
    }
}
