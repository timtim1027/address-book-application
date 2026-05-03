import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly nameRegex = /^[A-Za-z][A-Za-z\s'.-]{1,49}$/;
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly phoneAllowedCharsRegex = /^[+()0-9\s-]{7,20}$/;

  protected contacts: Contact[] = [
    { id: 1, name: 'Alice Tan', phone: '09171234567', email: 'alice@example.com' },
    { id: 2, name: 'Ben Cruz', phone: '09987654321', email: 'ben@example.com' }
  ];

  protected newContact: Omit<Contact, 'id'> = {
    name: '',
    phone: '',
    email: ''
  };

  protected searchTerm = '';
  protected deleteId: number | null = null;
  protected currentPage = 1;
  protected readonly pageSize = 5;
  protected sortField: 'id' | 'name' | 'email' = 'id';
  protected sortDirection: 'asc' | 'desc' = 'asc';
  protected editingId: number | null = null;
  protected editContact: Omit<Contact, 'id'> = { name: '', phone: '', email: '' };
  protected formError = '';
  protected editError = '';
  protected deleteError = '';

  protected get isDuplicateEmailInput(): boolean {
    return this.hasDuplicateEmail(this.newContact.email);
  }

  protected get isDuplicatePhoneInput(): boolean {
    return this.hasDuplicatePhone(this.newContact.phone);
  }

  protected get isDuplicateEmailEditInput(): boolean {
    if (this.editingId === null) {
      return false;
    }
    return this.hasDuplicateEmail(this.editContact.email, this.editingId);
  }

  protected get isDuplicatePhoneEditInput(): boolean {
    if (this.editingId === null) {
      return false;
    }
    return this.hasDuplicatePhone(this.editContact.phone, this.editingId);
  }

  protected addContact(form: NgForm): void {
    this.formError = '';

    const trimmedName = this.newContact.name.trim();
    const trimmedPhone = this.newContact.phone.trim();
    const trimmedEmail = this.newContact.email.trim();
    const validationError = this.validateContactInput(trimmedName, trimmedPhone, trimmedEmail);
    if (validationError) {
      this.formError = validationError;
      return;
    }

    const nextId = this.contacts.length > 0
      ? Math.max(...this.contacts.map((contact) => contact.id)) + 1
      : 1;

    this.contacts = [
      ...this.contacts,
      {
        id: nextId,
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail
      }
    ];

    form.resetForm({ name: '', phone: '', email: '' });
    this.currentPage = this.totalPages;
    window.alert('Contact added successfully.');
  }

  protected get filteredContacts(): Contact[] {
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      return this.contacts;
    }

    return this.contacts.filter((contact) =>
      contact.name.toLowerCase().includes(query)
    );
  }

  protected get sortedContacts(): Contact[] {
    return [...this.filteredContacts].sort((a, b) => {
      let comparison = 0;

      if (this.sortField === 'id') {
        comparison = a.id - b.id;
      } else {
        comparison = a[this.sortField].localeCompare(b[this.sortField], undefined, { sensitivity: 'base' });
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  protected get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedContacts.length / this.pageSize));
  }

  protected get paginatedContacts(): Contact[] {
    const safePage = Math.min(Math.max(this.currentPage, 1), this.totalPages);
    const start = (safePage - 1) * this.pageSize;
    return this.sortedContacts.slice(start, start + this.pageSize);
  }

  protected get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  protected setPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  protected setSort(field: 'id' | 'name' | 'email'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  }

  protected onSearchChange(): void {
    this.currentPage = 1;
  }

  protected startEdit(contact: Contact): void {
    this.editingId = contact.id;
    this.editContact = {
      name: contact.name,
      phone: contact.phone,
      email: contact.email
    };
    this.editError = '';
  }

  protected cancelEdit(): void {
    this.editingId = null;
    this.editContact = { name: '', phone: '', email: '' };
    this.editError = '';
  }

  protected updateContact(form: NgForm): void {
    if (this.editingId === null) {
      return;
    }

    this.editError = '';
    const trimmedName = this.editContact.name.trim();
    const trimmedPhone = this.editContact.phone.trim();
    const trimmedEmail = this.editContact.email.trim();

    const validationError = this.validateContactInput(trimmedName, trimmedPhone, trimmedEmail, this.editingId);
    if (validationError) {
      this.editError = validationError;
      return;
    }

    this.contacts = this.contacts.map((contact) =>
      contact.id === this.editingId
        ? { ...contact, name: trimmedName, phone: trimmedPhone, email: trimmedEmail }
        : contact
    );

    window.alert(`Contact #${this.editingId} updated successfully.`);
    form.resetForm();
    this.cancelEdit();
  }

  protected deleteContact(id: number): boolean {
    const contact = this.contacts.find((item) => item.id === id);

    if (!contact) {
      return false;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete contact #${contact.id} (${contact.name})?`
    );

    if (!confirmed) {
      return false;
    }

    this.contacts = this.contacts.filter((contact) => contact.id !== id);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    if (this.editingId === id) {
      this.cancelEdit();
    }
    window.alert(`Contact #${contact.id} deleted successfully.`);
    return true;
  }

  protected deleteById(): void {
    this.deleteError = '';

    if (this.deleteId === null || Number.isNaN(this.deleteId)) {
      this.deleteError = 'Please provide a valid contact ID.';
      return;
    }

    if (!Number.isInteger(this.deleteId) || this.deleteId < 1) {
      this.deleteError = 'Contact ID must be a positive whole number.';
      return;
    }

    const exists = this.contacts.some((contact) => contact.id === this.deleteId);
    if (!exists) {
      this.deleteError = `Contact #${this.deleteId} does not exist.`;
      return;
    }

    this.deleteContact(this.deleteId);
    this.deleteId = null;
  }

  private validateContactInput(name: string, phone: string, email: string, excludeId?: number): string | null {
    const normalizedPhone = this.normalizePhone(phone);

    if (!name || !phone || !email) {
      return 'All fields are required.';
    }

    if (!this.nameRegex.test(name)) {
      return 'Name must be 2 to 50 characters and use letters only.';
    }

    if (!this.emailRegex.test(email)) {
      return 'Please provide a valid email address.';
    }

    if (!this.phoneAllowedCharsRegex.test(phone) || normalizedPhone.length < 7 || normalizedPhone.length > 15) {
      return 'Phone must have 7 to 15 digits and contain only valid phone characters.';
    }

    if (this.hasDuplicateEmail(email, excludeId)) {
      return 'A contact with this email already exists.';
    }

    if (this.hasDuplicatePhone(phone, excludeId)) {
      return 'A contact with this phone number already exists.';
    }

    return null;
  }

  private hasDuplicateEmail(email: string, excludeId?: number): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    return !!normalizedEmail && this.contacts.some((contact) =>
      contact.email.toLowerCase() === normalizedEmail && contact.id !== excludeId
    );
  }

  private hasDuplicatePhone(phone: string, excludeId?: number): boolean {
    const normalizedPhone = this.normalizePhone(phone);
    return !!normalizedPhone && this.contacts.some((contact) =>
      this.normalizePhone(contact.phone) === normalizedPhone && contact.id !== excludeId
    );
  }

  private normalizePhone(value: string): string {
    return value.replace(/\D/g, '');
  }
}
