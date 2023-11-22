import { NameValue } from '../components/search-modal.component';
import { User, UserType } from '../models/user.model';

export class UserUtils {
	public static GroupUsersByType(
		users: User[],
		nameValue: boolean = false,
		allMandate: boolean = false,
		idOnly: boolean = false,
	): {
		assistants: any[];
		secretaries: any[];
		radiologists: any[];
		nursing: any[];
		mandatory: any[];
	} {
		const assistants: User[] | NameValue[] = [];
		const radiologists: User[] | NameValue[] = [];
		const nursing: User[] | NameValue[] = [];
		const secretaries: User[] | NameValue[] = [];
		const mandatory: User[] | NameValue[] = [];

		if (users?.length) {
			users.forEach((user) => {
				let newUser: any = user;

				if (nameValue) {
					newUser = { name: `${user.firstname} ${user.lastname}`, value: user.id.toString() };
				} else if (idOnly) {
					newUser = `${user.id}`;
				}

				if (user?.isMandate && !allMandate) {
					mandatory.push(newUser);
				} else {
					switch (user.userType) {
						case UserType.Assistant:
							assistants.push(newUser);
							break;
						case UserType.Radiologist:
							radiologists.push(newUser);
							break;
						case UserType.Nursing:
							nursing.push(newUser);
							break;
						case UserType.Secretary:
							secretaries.push(newUser);
							break;
						default:
					}
				}

				if (allMandate) {
					mandatory.push(newUser);
				}
			});
		}

		return {
			assistants,
			radiologists,
			nursing,
			secretaries,
			mandatory,
		};
	}
}
