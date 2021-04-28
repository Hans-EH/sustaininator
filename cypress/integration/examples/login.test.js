describe('My login Test', () => {
    it('Visits the login page for any user', () => {
        cy.visit('localhost:3000/login');
        cy.get('.action-register').click();
        cy.get('.action-login').click();

        // Get an email input, type into it and verify that the value has been updated
        cy.get('.action-email')
        .type('fake@email.com')
        .should('have.value', 'fake@email.com');
        
        // Get an password input, type into it and verify that the value has been updated
        cy.get('.action-password')
        .type('Ming#1359')
        .should('have.value', 'Ming#1359');
        cy.get('.action-submit').click();
        
        // When you login a test will be conducted to check if the user got a cookie.
        cy.getCookie('auth').should('have.property','value','608911a0070ea135f09e3705')
    });
});

describe('My front page Test', () => {
    it('Visits the front page', () => {
        cy.get('.graph');
    });
});


